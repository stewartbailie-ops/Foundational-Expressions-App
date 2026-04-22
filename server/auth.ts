import type { Request, Response, NextFunction } from "express";

const PUBLIC_API_ROUTES = [
  "/api/advisors/slug/",
  "/api/advisor-auth/",
  "/api/referral",
  "/api/callback",
  "/api/will-request",
  "/api/webhook/",
  "/api/stats/access",
  "/api/auth/login",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/upload/profile-pic",
  "/api/og-image/",
  "/uploads/",
];

const ADVISOR_SLUG_ROUTE_PATTERN = /^\/api\/advisors\/[^/]+\/(emails|stats|profile-stats)$/;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
    return next();
  }

  if (req.path.startsWith("/uploads/")) {
    return next();
  }

  for (const route of PUBLIC_API_ROUTES) {
    if (req.path.startsWith(route) || req.path === route) {
      return next();
    }
  }

  if (ADVISOR_SLUG_ROUTE_PATTERN.test(req.path)) {
    return next();
  }

  if ((req.session as any)?.authenticated) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}
