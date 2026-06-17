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

## Advisor-session route access (not just public allowlist)
`requireAuth` distinguishes ADMIN sessions (`session.authenticated`) from ADVISOR
sessions (`session.advisorId` + `advisor_<slug>`). Most `/api/advisors*` CRUD is
admin-only. Advisor sessions are opened up route-by-route: `/api/emails*`,
`/api/clients*`, `/api/billing*`, the `/api/advisors/:slug/(emails|stats|...)`
pattern, the `/api/advisors/:id/profiles` pattern, and (now) `PATCH
/api/advisors/:id` **for the advisor's own id only** (id must equal
session.advisorId — ownership enforced in the middleware regex).

**Gotcha:** the advisor sub-panel's primary-profile "Save Changes" PATCHes
`/api/advisors/:id`. It worked from the master admin panel but 401'd from the
advisor sub-panel because no advisor-session exception existed. When opening such a
route to advisor sessions, the handler MUST strip privileged fields for non-admins
(subscriptionTier/status, paystack*, trialEndsAt, advisorCode, advisorEmailVerified,
advisorPasswordSet, isDemo, orgId) — `insertAdvisorSchema` only omits id/createdAt,
so everything else is writable and an advisor could otherwise self-grant Premium.
