# Advisory Connect Control Panel

> Historical batch logs live in `docs/CHANGELOG.md`. This file keeps only architecture and active operational context.

## Overview
Master control panel for managing Advisory Connect profiles, tracking client referrals/callbacks, and auto-grading leads. Desktop-optimised panel, mobile-optimised public profile per advisor. Corporate black-and-white voice.

## Style / Voice Preferences
- **No emojis in UI** — Lucide icons only in buttons, badges, cards, headers, copy. Acceptable only as fallback in plain-text email subjects. Watch for the `📍` glyph in legacy `items` arrays — replace with Lucide when seen.
- Stewart uses ❤️ casually in chat — reciprocate sparingly in chat only, never in shipped UI copy.

## Architecture
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui
- **Backend**: Express + TypeScript
- **DB**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (`express-session` + `connect-pg-simple`), admin password in `ADMIN_PASSWORD` secret. Sessions 7 days.
- **Email**: SendGrid (`SENDGRID_API_KEY`)
- **QR**: `qrcode.react`
- Public routes (profile, lead forms, webhooks) are NOT auth-gated. Control panel + advisor sub-panel are.
- Auth middleware: `server/auth.ts`. Session setup: `server/index.ts`. Routes: `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.

## Database Tables
- `advisors` — profile + theme + services + subscription columns (`advisorCode`, `faisAgreementUrl`, `tosAcceptedAt`, `subscriptionTier`, `subscriptionStatus`, `trialEndsAt`, `paystack*`, `panelTheme/Color/BackgroundStyle`, all `show*` toggles).
- `advisor_profiles` — per-advisor secondary profile, same toggle surface as `advisors`, no inheritance.
- `emails` — lead submissions with grader fields (`leadScore`, `leadTemperature`, `gradeBreakdown`, lifestyle/income/age/services), `sourceProfileSlug` (primary vs secondary attribution; null = legacy → folded into primary on read).
- `stats` — events (`email_received`, `referral_sent`, `app_access:<slug>` for slug attribution).
- `clients`, `audit_pii`, `client_consent`, `client_documents` — POPIA-encrypted client vault (see PII section).
- `session` — provisioned by our own migration, NOT `connect-pg-simple` (see Production Startup Diagnostics).

## Database Migration Notes
Every column added so far has been additive `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. `drizzle-kit push --force` is upstream-broken (drizzle-kit beta vs drizzle-orm 0.45 `_relations` incompatibility) — additive ALTERs in `server/migrations.ts` are the workaround. Don't try `db:push --force` until both packages move past those versions.

## Deployment Target — Reserved VM
`.replit` `[deployment].deploymentTarget` is `vm` (not `autoscale`). Reasons: no cold starts, single warm instance simplifies session/crash reasoning, startup crashes are loud and immediate. Trade-off: bills continuously even at zero traffic — acceptable for current SA advisor base. **Do NOT flip back to `autoscale`** without re-reading the original rationale in `docs/CHANGELOG.md`.

## Production Startup Diagnostics
- `server/index.ts` has process-level `unhandledRejection` / `uncaughtException` handlers that print `err.name`, `err.message`, full stack as plain text before `process.exit(1)`. Added because production logs were truncating minified drizzle-orm bundle dumps.
- `server/migrations.ts` probes `to_regclass('public.advisor_profiles')` before issuing `ALTER TABLE`s. Missing table throws a clear untruncated message naming the cause (DB hasn't had `npm run db:push` run). ALTERs themselves are unwrapped — fail fast on any other migration error.
- **Session table is provisioned by our own migration**, NOT `connect-pg-simple`'s `createTableIfMissing` (that option reads `node_modules/.../table.sql` at runtime, which esbuild doesn't include in `dist/index.cjs` → `ENOENT` on first login in prod). `runStartupMigrations()` runs the same `CREATE TABLE IF NOT EXISTS "session"` schema and `server/index.ts` sets `createTableIfMissing: false`. **Do NOT flip this back.**
- The `pg-connection-string` "SECURITY WARNING" about sslmode is **deprecation noise** about a future v3.0.0 change. Current behaviour still sets `rejectUnauthorized: false`. **Do NOT add `ssl: { rejectUnauthorized: false }`** to `server/db.ts` as a "fix" — it's a no-op and was rejected in code review.

## POPIA / PII Encryption (Task #25)
At-rest encryption + audit trail for "special personal information" (POPIA s.26). Foundation for the My Clients feature.

**Architecture**
- `server/encryption.ts` — AES-256-GCM. Key in `PII_ENCRYPTION_KEY` secret (32-byte base64, `openssl rand -base64 32`). Wire format: `v1:<iv>:<ct>:<tag>` strings; `[iv(12)][tag(16)][ct]` raw for files. Round-trip self-test runs at startup — misconfigured key fails the boot.
- `clients` — plaintext name/email/phone; `id_number_enc`, `bank_account_enc`, `bank_branch_enc`, `tax_number_enc` are ciphertext only. `erased_at` / `erased_by` are the right-to-erasure tombstone.
- `audit_pii` — append-only via Postgres rules (UPDATE/DELETE rewrite to NOTHING). Records who/what/when/IP/UA for every PII read, write, erase, rate-limit block.
- `client_consent` — one row per consent grant, captures the exact text agreed to.
- `client_documents` — metadata only; bytes live encrypted on disk at `uploads/clients/<advisorId>/<random>.enc` (`chmod 0600`, never publicly served).
- **Per-advisor isolation is enforced at the storage layer**, not just routes — `listClients`/`getClient`/`updateClient`/`eraseClient` all take `advisorId` and `WHERE advisor_id = ?` it into the SQL. A forgotten route-level auth check cannot leak across advisors.
- **Rate limits** on `/api/callback`, `/api/referral`, `/api/will-request`, `/api/advisors/slug/:slug`, `/api/webhook/*`, `/api/stats/access`. 429 blocks log to `audit_pii`. Per-IP in-memory via `express-rate-limit`.
- **Right-to-erasure** — admin-only `POST /api/clients/:id/erase` wipes encrypted columns, unlinks documents, sets `erased_at`. Audit history retained (POPIA Reg 4 permits anonymised records).
- **API surface** — `/api/clients` CRUD + `/api/clients/:id/documents` + `/api/clients/documents/:id/download` + `/api/clients/:id/erase` + `/api/audit-pii` (admin read).

**Key-management runbook**
1. **Generate**: `openssl rand -base64 32` → `PII_ENCRYPTION_KEY` secret. Never commit, never log.
2. **Backup (mandatory before storing real PII)**: write the base64 to two sealed envelopes — one with Stewart offsite, one in the Advisory Connect safe. Each carries the date + checksum (`echo -n "<key>" | shasum -a 256`).
3. **Recovery dry-run (run BEFORE storing real PII)**: in a sandbox Repl, set the key, `POST /api/clients` with `idNumber: "TEST-9001"`, confirm `id_number_enc` is ciphertext in `psql`, restart with the SAME key from the sealed-envelope copy, `GET /api/clients/:id` must return `idNumber: "TEST-9001"`. Round-trip failure = re-generate and re-seal. **Dry-run log: pending — run before flipping My Clients to real data.**
4. **Rotation**: generate new key, do NOT delete old until every `*_enc` row is re-written. Add temporary `PII_ENCRYPTION_KEY_OLD`, run one-off rotation script (read old → re-encrypt new → write back) in a transaction, verify counts, delete old secret, update envelopes.
5. **Breach**: assume all encrypted columns are exposed. Notify the Information Regulator within 72h (POPIA s.22). Rotate immediately. Force-erase on request.

**Loss of `PII_ENCRYPTION_KEY` = permanent loss of all encrypted columns.** Sealed-envelope backup is not optional.

## Paystack Subscriptions (Task #26)
Recurring billing for R299 Basic / R499 Premium with a 14-day free trial. Pivoted from Stripe mid-task — Stripe doesn't onboard SA businesses yet. Paystack is SA-native, Stripe-owned, ZAR-first.

**Required secrets**: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (reserved, currently unused), `PAYSTACK_PLAN_BASIC`, `PAYSTACK_PLAN_PREMIUM`.

**Architecture**
- `server/paystack.ts` — plain `fetch` against `api.paystack.co` (no SDK). Helpers: `initializeTransaction`, `disableSubscription`, `getManageSubscriptionLink`, `verifyWebhookSignature`, `tierForPlanCode`. Webhook signature is HMAC-SHA512 of the raw body with `PAYSTACK_SECRET_KEY`, constant-time compared to `x-paystack-signature`. Raw body captured by the existing `express.json({ verify })` hook.
- **Source of truth**: `advisors.subscriptionTier` ∈ `trial`/`basic`/`premium`; `subscriptionStatus` ∈ `trialing`/`active`/`cancelled`/`past_due`. Webhook is the only writer for `subscriptionTier` post-checkout.
- **Tier gating**: `isPremiumActive(advisor)` / `isBasicOrBetter(advisor)` in `shared/schema.ts` — server and client both import these. Trial = full Premium access until `trialEndsAt` passes.
- **API surface**: `GET /api/billing/status`, `POST /api/billing/checkout {tier}` → `{authorizationUrl}`, `POST /api/billing/cancel` (waits for webhook to downgrade), `GET /api/billing/manage-link`, `POST /api/webhook/paystack` (public, signature-verified, idempotent — handles `charge.success`, `subscription.create`, `subscription.disable`, `subscription.not_renew`, `invoice.payment_failed`; returns 200 even on handler errors).
- `/api/billing/*` allow-listed for advisor sessions in `server/auth.ts`. Webhook in `PUBLIC_API_ROUTES`.
- **Trial-expiry email**: daily `setInterval` in `server/index.ts` finds advisors whose trial ends in ≤2 days and who haven't been emailed, sends via `sendTrialExpiryEmail`, marks `trialExpiryEmailSentAt`. First sweep 30s after boot.

**Tier split** (Stewart + Friday + Claude, 16 May 2026):
- **Basic R299/mo** — 1 public profile · 4 lead forms + grader · registry with grade + temperature · all themes + patterns · QR + share link + My Email · Daily Quotes · TradingView (1 instrument) · basic analytics · digital business card (footer baked in — viral loop) · 14-day trial.
- **Premium R499/mo** — adds: secondary profile · full grader breakdown + advanced analytics · image pattern presets · Editor's article · Compound + Retirement calcs · Financial Calendar · Fund Fact Sheets · Smartie Box · Risk Profile Quiz · TradingView multi-instrument · multi-format business cards with optional footer removal (white-label) · My Clients · Weekly Brief (coming) · Meeting Recording (coming) · priority support.
- **Rationale**: business card stays Basic to preserve viral loop; rich grader stays Basic so every advisor captures quality leads; insights + practice management + white-label are the genuine Premium upsell.

**KYC reminder**: certified IDs, CIPC reg, Standard Bank docs (sent in chat May 2026) need uploading to Paystack onboarding before live keys issue. Test-mode keys can be set immediately.

## Known Auth Gap (raised by code review, not yet fixed)
`/api/emails` GET, `/api/emails/:id/grade`, `/api/emails/:id/status`, `/api/emails/:id/open`, `DELETE /api/emails/:id` are unprotected. CIV is admin-gated at the page level but the data endpoints aren't, so leads are technically world-readable via direct API. AdvisorPanel also calls PATCH/DELETE, so locking down requires building advisor-session auth (separate task). CSV export IS admin-protected.

## CIV Grading System (Grader 2.0)
`calculateLeadGrade(input)` in `shared/schema.ts` returns `{score, grade, temperature, breakdown}`. Score /100, weighted:
- **Income** (0–35): R100k+→35, R75k+→30, R50k+→25, R35k+→20, R20k+→12, R10k+→6
- **Age** (0–20): 35–55→20, 28–65→14, 22+→8, <22→3
- **Lifestyle** (0–20): married/children/vehicle/property = +5 each
- **Services** (0–15): 4pts each (cap 15) + 3pt bonus for estate/will/retirement keywords
- **Source** (0–10): Callback→10, Will→7, Referral→5

Grade: Gold ≥75, Silver ≥55, Bronze ≥35, Development <35.
Temperature: Hot=Callback · Warm=Will OR Referral with rich data · Cold=Referral with minimal data.

Migration script: `scripts/recalculateLeads.ts` (idempotent, re-run anytime weights change).

## Key Features
1. **Home / Stats / CIV / Manage Advisors / Create / Edit Advisor** — admin control panel pages
2. **Public Profile** (`/profile/:slug`) — mobile-optimised, themed, expandable services, lead CTAs, QR
3. **Callback / Referral / Will lead forms** — POPIA-compliant, soft reCAPTCHA, grader-aware fields
4. **Advisor Sub-Panel** (`/advisor/:slug`) — per-advisor management of own profile + leads + share assets
5. **Financial Tools** on profile — SA Tax, Exchange Rate, Compound Interest, Vehicle Finance, Bond, Emergency Fund, Life Cover, Debt Payoff (each individually toggled). Pension Savings + CGT removed May 2026 pre-presentation (accuracy concerns on edge cases). DB columns `show_tool_pension` / `show_tool_cgt` retained per additive-only convention but no longer read/written.
6. **ZAR Rate Table** in Exchange Rate section — top 10 currencies vs ZAR both directions
7. **12 themes**: dark, blue, pink, light-blue, dark-royal-purple, dark-green, gold, teal, red, navy, coral, silver
8. **Background patterns** — 6 options with intensity slider (`patternOpacity` 5–100)
9. **Per-advisor secondary profiles** — `AdditionalProfileForm`, independent slug/theme/tools/services
10. **Digital Business Card** (Task #28) — canvas-rendered PNG, Portrait 1080×1920 (Stories) + Square 1080×1080 (Feed). Web Share API with download fallback. Footer bakes `advisoryconnect.pro/privacy-policy`. Helper: `client/src/lib/businessCard.ts`. Surfaces: AdvisorProfile share dialog + AdvisorPanel "Share Assets" section.
11. **Public Profile Feature Suite** (Task #29) — 5 toggleable sections per profile: TradingView embed (up to 8 instruments), Daily Quotes (general/investment, day-of-year rotation), Compound Calculator, Retirement Calculator, SA Financial Calendar (SARB MPC / SARS / Budget / JSE / FAIS for 2026). Helpers: `client/src/lib/dailyQuotes.ts`, `client/src/lib/financialCalendar.ts`. All in `DEFAULT_PROFILE_SECTION_ORDER` so they reorder via the existing Section Order UI.

## Routes
- **Admin**: `/`, `/stats`, `/civ`, `/manage`, `/create`, `/edit/:id`
- **Public**: `/profile/:slug`, `/profile/:slug/request-callback`, `/profile/:slug/referrals`, `/profile/:slug/will-request`
- **Advisor sub-panel**: `/advisor/:slug`
- **Legal**: `/privacy-policy`, `/terms`

## API Routes
- **Dashboard**: `GET /api/dashboard/stats`, `GET /api/dashboard/activity`
- **Advisors**: `GET /api/advisors`, `GET /api/advisors/slug/:slug`, `POST /api/advisors`, `PATCH /api/advisors/:id`, `PATCH /api/advisors/:id/toggle`, `GET /api/advisors/:slug/profile-stats`, `GET /api/advisors/:slug/views-series`
- **Emails / Leads**: `GET /api/emails`, `POST /api/emails`, `PATCH /api/emails/:id/grade`, `GET /api/emails/export.csv` (admin), `POST /api/referral`, `POST /api/callback`, `POST /api/will-request`
- **Webhooks**: `POST /api/webhook/zoho`, `POST /api/webhook/inbound-email`, `POST /api/webhook/paystack`
- **Billing**: `GET /api/billing/status`, `POST /api/billing/checkout`, `POST /api/billing/cancel`, `GET /api/billing/manage-link`
- **PII**: `/api/clients/*`, `/api/audit-pii` (admin)
- **Misc**: `POST /api/stats/access`, `POST /api/upload/profile-pic`, `GET /api/forex/rates`, `GET /api/news/feed`, `GET /api/manifest`

## File Structure
- `shared/schema.ts` — Drizzle schema, `calculateLeadGrade()`, `isPremiumActive`/`isBasicOrBetter`, BIO/SERVICE/TITLE/PLATFORM constants, `DEFAULT_PROFILE_SECTION_ORDER`, `PROFILE_SECTION_LABELS`
- `server/` — `db.ts`, `storage.ts` (IStorage interface), `routes.ts`, `auth.ts`, `migrations.ts`, `encryption.ts`, `paystack.ts`, `sendgrid.ts`
- `client/src/pages/` — HomePage, Dashboard, CIV, ManageAdvisors, CreateAdvisor, EditAdvisor, AdvisorProfile, AdvisorPanel, CallbackForm, ReferralForm, WillForm, LegalPage, Login
- `client/src/lib/` — `themeUtils.ts`, `businessCard.ts`, `dailyQuotes.ts`, `financialCalendar.ts`, `queryClient.ts`
- `client/src/components/BrandFooter.tsx` — single-row footer shared by admin panel, sub-panel, public profile

## UI Conventions
- **No emojis anywhere in UI.** Lucide React icons only (`X`, `Check`, `AlertTriangle`, `CalendarDays`, etc.). Exceptions: canvas-rendered images (business card) and printable HTML reports use plain text labels ("Tel", "Email", "Note:").
- Warning/alert: `AlertTriangle` + descriptive text. Close buttons: `X` icon with `aria-label="Close"`. Checkmarks: `Check` icon, not Unicode "✓".
- Lead form follow-ups use future-conditional ("If something were to happen tomorrow…") — never alarming.
- Ordinal labels for repeating items: word form First–Tenth, then numeric with proper suffix (11th–13th, 21st, etc.).

## Legal
- `/privacy-policy` and `/terms` from `LegalPage.tsx` — POPIA-compliant, last updated 27 April 2026, includes 90-day Lead Protection Commitment.
- Privacy notice above submit on all lead forms.
- Privacy + Terms footer links on AdvisorProfile, AdvisorPanel, master Login.
- Canvas-rendered business cards bake `advisoryconnect.pro/privacy-policy` into the footer.
