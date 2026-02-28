import type { Request, Response, NextFunction } from "express";

const PUBLIC_API_ROUTES = [
  "/api/advisors/slug/",
  "/api/referral",
  "/api/callback",
  "/api/webhook/",
  "/api/stats/access",
  "/api/auth/login",
  "/api/auth/session",
  "/api/auth/logout",
];

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  for (const route of PUBLIC_API_ROUTES) {
    if (req.path.startsWith(route) || req.path === route) {
      return next();
    }
  }

  if (!(req.session as any)?.authenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
}