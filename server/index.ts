import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes, registerOgImageRoute } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import { runStartupMigrations } from "./migrations";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// W1 T6: CSP Reporting API. Modern browsers prefer the `Report-To` /
// `Reporting-Endpoints` group + the CSP `report-to` directive over the legacy
// `report-uri`. We emit both so older Safari/Firefox builds (which still only
// understand report-uri) keep working while modern Chromium uses the new
// Reporting API. Our /api/csp-report endpoint already parses both payload
// shapes (application/csp-report + application/reports+json).
app.use((_req, res, next) => {
  res.setHeader("Reporting-Endpoints", 'csp-endpoint="/api/csp-report"');
  res.setHeader(
    "Report-To",
    JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: "/api/csp-report" }],
    })
  );
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["https://www.google.com"],
        connectSrc: ["'self'", "https:"],
        // CSP violation reporting (W1.6) — both directives emitted so old + new
        // browsers both report violations to /api/csp-report. report-uri stays
        // as the legacy fallback; report-to points at the Reporting-Endpoints
        // group declared in the middleware above.
        reportUri: ["/api/csp-report"],
        reportTo: ["csp-endpoint"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    // Browsers POST CSP violations as application/csp-report (legacy) or
    // application/reports+json (Reporting API). Parse both so /api/csp-report
    // sees a normal req.body.
    type: ["application/json", "application/csp-report", "application/reports+json"],
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// CSP violation reporting endpoint (W1.4). Registered BEFORE requireAuth because
// browsers send these reports without credentials. We log to the server console
// (and keep a small in-memory ring buffer of the last 50 for quick triage).
const cspReportBuffer: Array<{ ts: number; report: any }> = [];
app.post("/api/csp-report", (req, res) => {
  try {
    const body: any = req.body || {};
    // Legacy: { "csp-report": { ... } }
    // Reporting API: [{ type: "csp-violation", body: { ... } }, ...]
    const report = body["csp-report"] ?? (Array.isArray(body) ? body[0]?.body : body);
    cspReportBuffer.push({ ts: Date.now(), report });
    if (cspReportBuffer.length > 50) cspReportBuffer.shift();
    const blocked = report?.["blocked-uri"] || report?.blockedURL || "(unknown)";
    const directive = report?.["violated-directive"] || report?.effectiveDirective || "(unknown)";
    console.warn(`[CSP] Violation: directive="${directive}" blocked="${blocked}"`);
  } catch (err) {
    console.warn("[CSP] Failed to parse violation report:", err);
  }
  res.status(204).end();
});

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    secret: process.env.ADMIN_PASSWORD || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(requireAuth);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

// Surface any unhandled rejection or uncaught exception with a CLEAR plaintext
// message before the process exits. Production deploy logs were truncating
// minified bundle stacks and hiding the real error class behind drizzle-orm
// source dumps; printing err.name + err.message + stack as plain text first
// guarantees the next incident is diagnosable. We do NOT swallow — Node's
// default exit behaviour is preserved so misconfigured startups still fail
// fast and the deploy is marked broken.
process.on("unhandledRejection", (reason) => {
  console.error(
    "[startup] UNHANDLED REJECTION:",
    reason instanceof Error ? `${reason.name}: ${reason.message}\n${reason.stack}` : String(reason)
  );
  // Preserve Node's default fail-fast behaviour. Just attaching a listener
  // would otherwise suppress the default exit, leaving startup hung.
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(
    "[startup] UNCAUGHT EXCEPTION:",
    `${err.name}: ${err.message}\n${err.stack}`
  );
  process.exit(1);
});

(async () => {
  await runStartupMigrations();
  // Task #25 — Encryption self-test. If the key is configured, prove a
  // round-trip works at boot so a misconfigured key fails loudly here
  // (before any client tries to write PII), not silently later. If the key
  // is NOT configured we log a warning — encryption-dependent endpoints
  // return 503 until the operator sets PII_ENCRYPTION_KEY.
  const { selfTest, keyStatus } = await import("./encryption");
  const ks = keyStatus();
  if (ks === "invalid") {
    console.error("[startup] PII_ENCRYPTION_KEY is SET but INVALID (wrong length or not base64). Refusing to start — fix the secret or unset it. See replit.md 'POPIA / PII Encryption'.");
    process.exit(1);
  }
  if (ks === "valid") {
    const r = selfTest();
    if (!r.ok) {
      console.error("[startup] PII encryption self-test FAILED:", r.error);
      process.exit(1);
    }
    console.log("[startup] PII encryption self-test passed");
  } else {
    console.warn("[startup] PII_ENCRYPTION_KEY not set — /api/clients endpoints will 503 until configured. See replit.md 'POPIA / PII Encryption'.");
  }
  await registerRoutes(httpServer, app);
  registerOgImageRoute(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const cause = err.cause?.message || err.cause?.toString?.() || "";
    const message = cause
      ? `${err.message || "Internal Server Error"} | cause: ${cause}`
      : err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host.includes(".replit.app")) {
      const qs = req.url.startsWith(req.path) ? req.url.slice(req.path.length) : "";
      return res.redirect(301, `https://app.advisoryconnect.pro${req.path}${qs}`);
    }
    next();
  });

  const RESERVED = ["stats", "civ", "manage", "create", "edit", "profile", "api", "uploads", "assets"];
  const CRAWLER_UA = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|bot|crawler|spider|preview/i;

  // Render an advisor-themed OG document for crawlers. Shared by both the
  // bare-root branch (sole-advisor fallback) and the per-slug branch.
  const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const renderAdvisorOg = (advisor: any): string => {
    const title = esc(`${advisor.name}${advisor.title ? " — " + advisor.title : ""} | Advisory Connect`);
    const description = esc(`Connect with ${advisor.name} for personalised financial guidance on tax, investments, retirement, and more.`);
    const siteUrl = `https://app.advisoryconnect.pro/${advisor.profileSlug}`;
    const hasPic = !!advisor.profilePicUrl;
    const imageUrl = hasPic ? `https://app.advisoryconnect.pro/api/og-image/${advisor.profileSlug}` : "";
    const imageTag = hasPic
      ? `<meta property="og:image" content="${imageUrl}" />
<meta property="og:image:width" content="600" />
<meta property="og:image:height" content="600" />
<meta name="twitter:image" content="${imageUrl}" />
<meta name="twitter:card" content="summary_large_image" />`
      : `<meta name="twitter:card" content="summary" />`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${siteUrl}" />
${imageTag}
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<title>${title}</title>
</head>
<body></body>
</html>`;
  };

  app.use(async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    if (!CRAWLER_UA.test(ua)) return next();

    // Slug extraction: handle BOTH bare-root URLs (e.g. /stewart-bailie) AND
    // the canonical /profile/:slug URL that the share buttons actually emit.
    // Previously only bare-root was handled, so WhatsApp/Facebook scraping
    // /profile/stewart-bailie saw "profile" in RESERVED and fell through to
    // the static control-panel og:image.
    const segments = req.path.replace(/^\//, "").split("/").filter(Boolean);
    let slug: string | undefined;
    if (segments[0] === "profile" && segments[1]) {
      slug = segments[1];
    } else if (segments[0]) {
      slug = segments[0];
    }

    // Bare root URL — if there's exactly ONE active advisor with a profile
    // pic, surface their card. With 0 or 2+ active advisors the bare URL is
    // ambiguous, so fall through to the static index.html (clean AC branding).
    if (!slug) {
      try {
        const all = await storage.getAdvisors();
        const eligible = all.filter((a: any) => a.active && a.profileSlug && a.profilePicUrl);
        if (eligible.length === 1) {
          return res.status(200).set({ "Content-Type": "text/html" }).send(renderAdvisorOg(eligible[0]));
        }
      } catch {
        // fall through to static
      }
      return next();
    }

    // Only RESERVED-check the bare-root branch; if we already matched
    // /profile/:slug above, we know the second segment is an advisor slug.
    if (segments[0] !== "profile" && RESERVED.includes(slug)) return next();

    try {
      const advisor = await storage.getAdvisorBySlug(slug);
      if (!advisor) return next();
      res.status(200).set({ "Content-Type": "text/html" }).send(renderAdvisorOg(advisor));
    } catch {
      next();
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      ...(process.platform !== "win32" && { reusePort: true }),
    },
    () => {
      log(`serving on port ${port}`);
      // Demo leads are now top-up only (admin-triggered via the Top Up button).
      // No auto-seed on startup/restart/republish.
    },
  );
})();
