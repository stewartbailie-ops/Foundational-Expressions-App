import type { Request, Response, NextFunction } from "express";

const PUBLIC_API_ROUTES = [
  "/api/advisors/slug/",
  "/api/advisor-auth/",
  "/api/referral",
  "/api/callback",
  "/api/demo-emails",
  "/api/will-request",
  "/api/webhook/",
  "/api/stats/access",
  "/api/auth/login",
  "/api/auth/session",
  "/api/auth/logout",
  "/api/og-image/",
  "/api/moneyweb/",
  "/api/news/",
  "/api/forex/",
  "/api/csp-report",
  "/api/manifest",
  "/uploads/",
];

const ADVISOR_SLUG_ROUTE_PATTERN = /^\/api\/advisors\/[^/]+\/(emails|stats|profile-stats|views-series)$/;
// Per-handler ownership check is enforced for these paths. The middleware only lets the request reach the handler.
const ADVISOR_OWNED_ROUTE_PATTERN = /^\/api\/advisors\/\d+\/profiles(\/.*)?$/;

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

  if (ADVISOR_OWNED_ROUTE_PATTERN.test(req.path)) {
    // Handler must call assertAdvisorAccess() to verify ownership.
    return next();
  }

  if ((req.session as any)?.authenticated) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}

// Task #24 — Advisor-session middleware. Resolves the slug from the request
// (param or path) and rejects when no advisor session is present for it.
// Admin sessions bypass (admin can act on any advisor's behalf), preserving
// existing CIV behaviour. The middleware deliberately returns a generic 401
// with no advisor metadata to avoid disclosing slug existence.
export function requireAdvisorAuth(slugParam: string = "slug") {
  return (req: Request, res: Response, next: NextFunction) => {
    if ((req.session as any)?.authenticated) return next();
    const slug = (req.params as any)?.[slugParam];
    if (slug && (req.session as any)?.[`advisor_${slug}`]) return next();
    return res.status(401).json({ message: "Unauthorized" });
  };
}
