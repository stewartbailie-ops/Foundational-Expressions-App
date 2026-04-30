import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import session from "express-session";
import { registerRoutes, registerOgImageRoute } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
        // CSP violation reporting (W1.4) — gives us visibility into anything legitimate
        // being silently blocked in production. Endpoint logs to the server console.
        reportUri: ["/api/csp-report"],
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

app.use(
  session({
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

(async () => {
  await registerRoutes(httpServer, app);
  registerOgImageRoute(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

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
      return res.redirect(301, `https://advisoryconnect.pro${req.path}${qs}`);
    }
    next();
  });

  const RESERVED = ["stats", "civ", "manage", "create", "edit", "profile", "api", "uploads", "assets"];
  const CRAWLER_UA = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|bot|crawler|spider|preview/i;

  app.use(async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    if (!CRAWLER_UA.test(ua)) return next();

    const slug = req.path.replace(/^\//, "").split("/")[0];
    if (!slug || RESERVED.includes(slug)) return next();

    try {
      const advisor = await storage.getAdvisorBySlug(slug);
      if (!advisor) return next();

      const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const title = esc(`${advisor.name}${advisor.title ? " — " + advisor.title : ""} | Advisory Connect`);
      const description = esc(`Connect with ${advisor.name} for personalised financial guidance on tax, investments, retirement, and more.`);
      const siteUrl = `https://advisoryconnect.pro/${advisor.profileSlug}`;
      const hasPic = !!(advisor as any).profilePicUrl;
      const imageUrl = hasPic ? `https://advisoryconnect.pro/api/og-image/${advisor.profileSlug}` : "";
      const imageTag = hasPic
        ? `<meta property="og:image" content="${imageUrl}" />
<meta property="og:image:width" content="600" />
<meta property="og:image:height" content="600" />
<meta name="twitter:image" content="${imageUrl}" />
<meta name="twitter:card" content="summary_large_image" />`
        : `<meta name="twitter:card" content="summary" />`;

      res.status(200).set({ "Content-Type": "text/html" }).send(`<!DOCTYPE html>
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
</html>`);
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
