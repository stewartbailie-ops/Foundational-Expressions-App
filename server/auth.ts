import type { Request, Response, NextFunction } from "express";

const PUBLIC_API_ROUTES = [
  "/api/advisors/slug/",
  "/api/advisor-auth/",
  "/api/referral",
  "/api/callback",
  "/api/webhook/",
  "/api/stats/access",
  "/api/auth/login",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/upload/profile-pic",
  "/uploads/",
];

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

  if ((req.session as any)?.authenticated) {
    return next();
  }

  const session = req.session as any;
  const hasAdvisorSession = Object.keys(session || {}).some(
    (key) => key.startsWith("advisor_") && session[key] === true
  );
  if (hasAdvisorSession) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}
