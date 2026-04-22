# Threat Model

## Project Overview

Advisory Connect is a React + Vite frontend with an Express + TypeScript backend and PostgreSQL database. It serves two production surfaces: public advisor profile pages and public lead-capture forms for prospective clients, plus authenticated control panels for administrators and individual advisors. The server also accepts inbound webhook-style email ingestion and sends notification emails via SendGrid.

Production assumptions for this scan:
- Only production-reachable code paths are in scope.
- `NODE_ENV` is `production` in deployed environments.
- TLS is provided by the platform.
- Mockup/sandbox-only flows are out of scope unless production reachability is demonstrated.

## Assets

- **Advisor and admin sessions** — session cookies grant access to management APIs and advisor control panels. Compromise allows unauthorized reads and writes across business data.
- **Advisor account credentials** — admin password, advisor password hashes, onboarding state, and any verification artifacts. Compromise enables impersonation and privilege escalation.
- **Lead and client records** — referral, callback, and will-request data includes names, emails, phone numbers, ages, income bands, address details, ID numbers, and free-form notes. This is sensitive personal and business data.
- **Private advisor metadata** — advisor email addresses, internal notes, agreement documents, subscription state, and advisor codes. These are not intended for general public disclosure.
- **Application secrets and integrations** — database credentials, SendGrid API key, and reCAPTCHA secret. Exposure would enable service compromise or abuse.

## Trust Boundaries

- **Browser to server** — all client requests are untrusted, including public profile traffic, public form submissions, and authenticated panel requests.
- **Public user to advisor/admin boundary** — public viewers should only access intentionally public profile content, never internal advisor or lead data.
- **Advisor to admin boundary** — advisors are lower-privileged authenticated users; they must not gain access to admin-wide management APIs or other advisors' data.
- **Server to database** — backend code has broad database access; any authorization failure or over-broad response at the API layer can expose the full dataset.
- **Third-party service to server** — webhook endpoints and inbound email handlers must authenticate the calling service before mutating stored data.
- **Server to email provider** — outbound messages may contain sensitive lead details and must avoid disclosure through logs or unintended recipients.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/auth.ts`, `server/storage.ts`, `client/src/App.tsx`, `client/src/pages/AdvisorProfile.tsx`, `client/src/pages/AdvisorPanel.tsx`.
- **Highest-risk code areas:** session/auth logic in `server/auth.ts` and `server/routes.ts`; public advisor lookup and lead APIs in `server/routes.ts`; data shaping in `server/storage.ts`; public profile/advisor panel data consumption in `client/src/pages/*`.
- **Public surfaces:** `/:slug` crawler path, `/api/advisors/slug/:slug`, `/api/referral`, `/api/callback`, `/api/will-request`, `/api/webhook/*`, `/api/stats/access`, advisor auth onboarding endpoints.
- **Authenticated surfaces:** admin management APIs under `/api/advisors*`, `/api/emails*`, dashboard routes, advisor-specific `/api/advisors/:slug/emails`, `/api/advisors/:slug/stats`.
- **Usually ignore unless proven reachable in production:** Vite/dev tooling, generated `dist/`, `attached_assets/`, and local workflow/dev-only artifacts.

## Threat Categories

### Spoofing

The application trusts session state for both admin and advisor access, and it accepts unauthenticated webhook-style requests that create stored records. The system must ensure every protected API request is tied to the correct authenticated principal and every webhook request is cryptographically validated as originating from the expected provider.

### Tampering

Public submissions, advisor profile updates, and inbound email/webhook payloads all write into the same business records. The system must prevent low-privilege users and unauthenticated callers from creating, modifying, or deleting records outside their intended scope, and must enforce role separation server-side rather than in the client.

### Information Disclosure

Public advisor profile traffic should only receive fields intended for public display. Lead records, advisor private metadata, password hashes, internal notes, agreement documents, and sensitive PII must never be returned on public endpoints or copied into logs by default. Error handling and telemetry must avoid exposing raw secrets or personal data.

### Denial of Service

Public forms, image/PDF upload helpers, and webhook endpoints accept attacker-controlled input and can trigger database writes and outbound email. The system must bound request size and rate, and external calls should fail safely without turning abuse protections into ineffective no-ops. The product intentionally treats reCAPTCHA as an advisory signal rather than a hard production gate, so future scans should not report generic CAPTCHA-soft-fail behavior unless it combines with another materially exploitable path such as spoofed record creation or high-impact resource exhaustion.

### Elevation of Privilege

Administrators and advisors are distinct roles. Advisor authentication must not grant access to admin-only APIs, and onboarding flows must not let an attacker claim an account or bypass email verification. All role and object-level authorization checks must be enforced in backend route handlers or middleware, not assumed from frontend routing.
