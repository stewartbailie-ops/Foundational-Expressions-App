import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes, registerOgImageRoute } from "./routes";
import { autoTrickleDemoLeads } from "./demoSeeder";
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
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

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
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      // Auto-trickle: add a couple of fresh demo leads on each server start so the
      // public demo profiles always look alive. Safe no-op if no demo advisors exist.
      const perAdvisor = parseInt(process.env.DEMO_LEADS_PER_RESTART || "2", 10);
      if (perAdvisor > 0) {
        autoTrickleDemoLeads(perAdvisor)
          .then(r => {
            if (r.advisors > 0) {
              log(`[demoSeeder] auto-trickle added ${r.leadsAdded} leads across ${r.advisors} demo advisor(s)`);
            }
          })
          .catch(err => console.error("[demoSeeder] startup trickle error:", err));
      }
    },
  );
})();
