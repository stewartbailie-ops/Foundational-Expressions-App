---
name: Public endpoints must be allowlisted in server/auth.ts
description: New unauthenticated/public API routes 401 unless added to PUBLIC_API_ROUTES, even if the handler has no auth gate.
---
# Public endpoint allowlist gotcha

`requireAuth` in `server/auth.ts` runs a global gate over all `/api/*` paths. A request
must match `PUBLIC_API_ROUTES` (startsWith/exact) BEFORE it reaches the route handler.

**The trap:** writing a route handler with no auth check is NOT enough. If the path isn't
in `PUBLIC_API_ROUTES`, the middleware returns 401 first and the handler never runs.

**Why:** the public self-service onboarding ("Get Started") flow calls `/api/register`
and `/api/upload/registration-pic` while the prospective advisor has no session. Both
were missing from the allowlist → every onboarding photo upload failed with 401.

**How to apply:** any time you add a route meant to be reachable without a session
(public forms, webhooks, onboarding, OG images, etc.), add its path to
`PUBLIC_API_ROUTES` in `server/auth.ts`. Keep per-route rate limiting on these.
This is a sibling gotcha to the `PUBLIC_ADVISOR_FIELDS` allowlist in `server/routes.ts`.
