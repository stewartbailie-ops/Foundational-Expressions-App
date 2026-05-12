# Advisory Connect Control Panel

## Overview
A master control panel / dashboard for managing Advisory Connect profiles, tracking client referrals/callbacks, and auto-grading clients. Desktop-optimized, corporate black-and-white theme. Each advisor gets a public-facing mobile-optimized profile page.

## Style / Voice Preferences
- **No emojis in UI** — corporate vibe. Always use Lucide icons (already imported across the app) instead of emoji glyphs in buttons, badges, cards, headers, or any visible UI text. Acceptable: emoji as fallback in plain-text email subjects only if necessary. The `📍` glyph in the contact-card "items" array is also an emoji — replace with Lucide where seen.
- Stewart (the user) uses ❤️ casually in chat — reciprocate sparingly in chat only, never in shipped UI copy.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple), password stored as `ADMIN_PASSWORD` secret
- **Email Service**: SendGrid (API key stored as secret `SENDGRID_API_KEY`)
- **QR Codes**: `qrcode.react` for dynamic barcode generation

## Authentication
- Control panel routes are protected behind a login screen (password-only)
- Sessions stored in PostgreSQL via `connect-pg-simple` (auto-creates `session` table)
- Session lasts 7 days
- Public routes (profile pages, callback/referral forms, webhooks) are NOT protected
- Login: `POST /api/auth/login`, Session check: `GET /api/auth/session`, Logout: `POST /api/auth/logout`
- Auth middleware in `server/auth.ts`, session setup in `server/index.ts`

## Database Tables
- `advisors` - Advisor profiles (name, email, title, bio, bioOption, customBio, entityType, theme, themeColor, font, profilePicUrl, coverImageUrl, linkedinUrl, websiteUrl, profileSlug, individualServices[], corporateServices[], active, createdAt, **advisorCode, faisAgreementUrl, tosAcceptedAt, subscriptionTier, panelTheme, panelThemeColor, panelBackgroundStyle**)
- `emails` - Incoming client submissions (senderName, senderEmail, type, grade, subject, body, clientAge, clientIncome, clientIndustry, clientPhone, clientMarried, clientChildren, clientVehicle, clientProperty, preferredContactTime, servicesRequested, referrerName, referrerEmail, referrerPhone, referrerRelation, source, sourceProfileSlug). `sourceProfileSlug` records WHICH profile slug a lead came in via (primary or secondary) — powers the "Where Leads Came From" attribution card on the advisor home tab. Null for legacy leads (folded into primary bucket on read).
- `stats` - Event tracking (email_received, referral_sent, app_access)

## Advisor Profile Fields
- **Title**: Executive Financial Planner / Financial Planner / Executive Financial Advisor / Financial Advisor
- **Bio Options**: a (core focus), b (integrated strategic), c (clarity & structure), or custom
- **Individual Services**: 7 services (tax-efficiency, tax-investment, personal-risk, retirement, medical-aid, short-term, wills-estates)
- **Corporate Services**: 5 services (corporate-planning, group-risk, pension-provident, group-medical, corporate-short-term)
- **Theme**: dark (black/white), blue, or pink
- **Profile Picture**: Uploaded via multer to `/uploads/` directory, URL stored as `profilePicUrl`
- Services stored as key arrays, displayed by name via constants in schema.ts

## Build History (Phases 1–5, April 2026, all completed)
Condensed log. Each item is shipped + verified — listed here so we know it exists, not how it's wired (read the code if you need internals).

**CIV / Lead Registry**
- Lead temperature glow on CIV rows (Phase 1 → 5: started as 4px left bar + tint, ended as full surround `boxShadow` ring + ambient glow on AdvisorPanel cards). Hot=red / Warm=amber / Cold=sky, sourced from `email.leadTemperature`.
- CSV export `GET /api/emails/export.csv` (admin-protected, formula-injection-safe with `'` prefix for `=+-@`, UTF-8 BOM).
- Registry enhancements: double-click column-header sort, date range filter, unread blue dot + bold rows + count badge, "New" unread-only quick filter pill.
- Active / Archived tab split (CIV + AdvisorPanel). Archived view hides status filter row, shows `archivedAt`.
- Enhanced timestamps on `emails`: `firstViewedAt`, `lastViewedAt`, `archivedAt`. Admin opens bump `lastOpenedAt`; advisor opens bump `firstViewedAt` + `lastViewedAt`. `updateEmailStatus` sets/clears `archivedAt` on Archive transitions.
- Grader 2.0 indicators (Hot/Warm/Cold pill + numeric `leadScore`) shown on AdvisorPanel lead-card headers.

**Profile / Advisor Panel content**
- Daily fun facts carousel (`FunFactsCarousel.tsx`, `client/src/data/funFacts.ts`, 300 facts → `getDailyFacts()` deterministic 6-per-day, 8-colour category palette in `FUN_FACT_CATEGORY_COLORS`). Behind `showFunFacts` toggle.
- Live forex widget (`ForexWidget.tsx` + `GET /api/forex/rates` proxy of api.frankfurter.app, 60s cache, stale-on-failure). Behind `showForex` toggle.
- Secondary news feed: extended `/api/news/feed` `SOURCES_BY_CAT` with `secondary` category (BBC Africa + MarketWatch + Investing.com FX — SA-domestic feeds were bot-blocked by Cloudflare). Behind `showSecondNews` toggle.
- All three new sections added to `DEFAULT_PROFILE_SECTION_ORDER` + `PROFILE_SECTION_LABELS`, surface as toggles in ProfileTab "Profile Page Elements", added to `PUBLIC_ADVISOR_FIELDS` allowlist in `server/routes.ts`. AdvisorPanel HomeTab shows live previews of all three, gated by the same toggles.
- Per-platform public-card toggles: `showLiberty`, `showStanlib`, `showSigninghub` (default false, opt-in). Single source of truth `PLATFORMS_META` in `shared/schema.ts` shared by AdvisorPanel `PlatformsTab` + AdvisorProfile public section. Public section auto-hides when all 3 flags off.
- Contact card button regrouping on AdvisorProfile: 3 stacked rows ("Get in touch" / "Share & save" / "Install"), Save Contact promoted to primary CTA.
- "Add to Home Screen" guidance card at top of AdvisorPanel SettingsTab (iOS + Android numbered steps, static markup).

**Infrastructure / Quality**
- CSP violation reporting: `reportUri: ["/api/csp-report"]` in Helmet, endpoint accepts `application/csp-report` + `application/reports+json`, ring-buffers last 50 violations, logs as `[CSP] Violation: directive="..." blocked="..."`. Returns 204.
- Bundle splitting: `vite.config.ts` `manualChunks` splits radix/lucide/forms/query/react-dom/react+wouter/date-fns/recharts into vendor chunks. `App.tsx` lazy-loads admin + low-traffic public pages inside `<Suspense>` (hot-path public pages stay eager). Main chunk: 1,567 → 371 kB (433 → 108 kB gzip). `chunkSizeWarningLimit: 600`.
- SA English wording sweep across `shared/schema.ts` `INDIVIDUAL_SERVICES` + `client/src/pages/AdvisorProfile.tsx` fallbacks (Optimize → Optimise, minimize → minimise, etc.).

**Migration note**: every column added in this period used additive `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (no PK changes). `drizzle-kit push --force` is upstream-broken (drizzle-kit beta vs drizzle-orm 0.45 `_relations` incompatibility) — additive ALTERs in `server/migrations.ts` are the workaround. Don't try `db:push --force` until both packages move past those versions.

## Deployment Target — Reserved VM (May 2026)
Switched `.replit` `[deployment].deploymentTarget` from `autoscale` to `vm` (Reserved VM). Decision rationale:
- **Cold starts gone**: Autoscale was spinning the instance down between traffic, so the first hit after idle ate the full Node + drizzle + Vite-static boot. Reserved VM keeps one warm instance, so the public profile + lead forms respond immediately.
- **Sessions**: We use `connect-pg-simple` (Postgres-backed sessions) so multi-instance was already safe, but a single warm VM removes the entire question — no replica sticky-routing or session-store edge cases to reason about.
- **Startup-crash visibility**: After May 2026's `unhandledRejection`/`uncaughtException` plain-text logging, a Reserved VM crash is loud and immediate (one instance, one log stream) instead of being masked by autoscale silently retrying a fresh instance.
- **Trade-offs accepted**: Reserved VM bills continuously even at zero traffic (Autoscale only billed per request). For our load profile (small SA advisor base, steady not spiky) the warm-instance UX win + simpler ops outweighs the cost delta. Revisit if traffic ever becomes genuinely bursty / >10× current.
- **Action required from user**: config is saved in `.replit` but takes effect on next publish — Stewart needs to click Publish from the main project after this task merges.
- Do NOT flip back to `autoscale` without re-reading this section; the cold-start and crash-visibility issues will return.

## Production Startup Diagnostics (May 2026)
- **server/index.ts** registers process-level `unhandledRejection` and `uncaughtException` handlers that print `err.name`, `err.message`, and the full stack as plain text before calling `process.exit(1)`. This was added because production deploy logs were truncating minified drizzle-orm bundle dumps and hiding the real error class on a startup crash. Fail-fast behaviour is preserved (explicit `exit(1)`).
- **server/migrations.ts** probes `to_regclass('public.advisor_profiles')` before issuing `ALTER TABLE` statements. If the table is missing it throws a clear, untruncated message naming the cause (DB hasn't had `npm run db:push` run against it). ALTERs themselves are not wrapped — startup fails fast on any other migration error rather than silently 500ing on every advisor route at runtime.
- **Session table is provisioned by our own migration**, NOT by `connect-pg-simple`'s `createTableIfMissing` option. That option reads `node_modules/connect-pg-simple/table.sql` at runtime, which esbuild does not include in `dist/index.cjs` — production then crashes with `ENOENT: ... open '/dist/table.sql'` on first login. `runStartupMigrations()` runs the same `CREATE TABLE IF NOT EXISTS "session" ...` schema verbatim from `connect-pg-simple/table.sql` and `server/index.ts` sets `createTableIfMissing: false` on the store. Do NOT flip this back — it will break login in prod.
- The `pg-connection-string` "SECURITY WARNING" about sslmode `prefer`/`require`/`verify-ca` being treated as `verify-full` is **deprecation noise** about a future v3.0.0 change. Source of `pg-connection-string@2.10.0` confirms the current behaviour still sets `rejectUnauthorized: false` for those modes (lines 109 + 117 of node_modules/pg-connection-string/index.js). `server/db.ts` left untouched — do NOT add `ssl: { rejectUnauthorized: false }` as a "fix"; it's a no-op masquerading as one and was rejected in code review.

## Known Auth Gap (raised by code review, not yet fixed)
`/api/emails` GET, `/api/emails/:id/grade`, `/api/emails/:id/status`, `/api/emails/:id/open`, `DELETE /api/emails/:id` are currently unprotected. CIV is admin-session-gated at the page level but the data endpoints aren't, so leads are technically world-readable via direct API. AdvisorPanel.tsx (`/advisor/:slug`) also calls the PATCH/DELETE endpoints, so locking them down requires building advisor-session auth (separate task). New CSV export endpoint IS admin-protected.

## CIV Grading System (Grader 2.0)
Implemented in `shared/schema.ts` via `calculateLeadGrade(input)`. Returns `{ score, grade, temperature, breakdown }`. Score is out of 100, weighted across 5 categories:
- **Income** (0-35): R100k+→35, R75k+→30, R50k+→25, R35k+→20, R20k+→12, R10k+→6
- **Age** (0-20): 35-55→20, 28-65→14, 22+→8, <22→3
- **Lifestyle** (0-20): married/children/vehicle/property = +5 each
- **Services** (0-15): 4pts per service listed (capped at 15) + 3pt bonus for estate/will/retirement keywords
- **Source** (0-10): Call Back→10, Will Request→7, Referral→5

Grade thresholds: Gold ≥75, Silver ≥55, Bronze ≥35, Development <35.

**Temperature** (independent axis, urgency/intent):
- **Hot**: Call Back submissions
- **Warm**: Will Request, OR Referral with rich client data (income or age)
- **Cold**: Referral with minimal data, or unmatched

CIV.tsx shows score/temperature pill under the grade selector and a full breakdown panel in the expanded detail row. New email rows store `leadScore`, `leadTemperature`, `gradeBreakdown` (JSON). Migration script: `scripts/recalculateLeads.ts` (idempotent, re-run anytime weights change).

## Key Features
1. **Home** - Welcome message, quick stats summary, navigation cards
2. **Stat's Tracker** - Real-time stats from database with weekly activity chart
3. **CIV (Client Information Viewer)** - Client table with grade cards, search, filter, expandable detail rows, inline grade override
4. **Manage Advisors** - List advisors with active/inactive toggles, edit/view/copy/delete buttons, "New Advisor" button
5. **Create New Advisor** - Full form with header, profile pic, bio options, services checkboxes, theme selection, QR code preview
6. **Edit Advisor** (`/edit/:id`) - Full editing of existing advisor profiles
7. **Public Profile Page** (`/profile/:slug`) - Mobile-optimized, dark/blue/pink themed, expandable services, callback/referral buttons, QR code, large profile pictures
8. **Callback Form** (`/profile/:slug/request-callback`) - Client details form with income, situation toggles, service selection
9. **Referral Form** (`/profile/:slug/referrals`) - Referrer details + up to 4 referral entries
10. **Financial Tools on Profile** - Collapsible "Financial Tools" section on public profile with 6 calculators: SA Tax, Exchange Rate, Compound Interest, Pension Savings, Capital Gains Tax, Vehicle Finance — each individually toggled in advisor panel
11. **ZAR Rate Table in Toolbox** - Exchange Rate section in advisor toolbox shows ZAR vs top 10 global currencies table (1 ZAR = X, 1 unit = X ZAR)
12. **reCAPTCHA** - Widget shown on forms (advisory, non-blocking) — removed hard gate so forms submit even if reCAPTCHA not completed; server-side soft-fail (returns true on network error)
13. **Portrait Profile Header** - Public profile uses circular photo/initials at top of gradient card, centered name+title, with 2×2 utility button row inside the card
14. **12 Themes** - dark, blue, pink, light-blue, dark-royal-purple, dark-green, gold, teal, red, navy, coral, silver
15. **Background Patterns** - Advisors can pick from 6 background patterns with intensity slider (patternOpacity 5–100)
16. **Per-advisor Mini Profiles** - AdditionalProfileForm lets advisors customize their own sub-profile (slug, theme, tools, pattern, services, etc.) independently of their main advisor record

## Routes
### Control Panel (inside AppLayout)
- `/` Home, `/stats` Dashboard, `/civ` CIV, `/manage` Manage Advisors, `/create` Create Advisor, `/edit/:id` Edit Advisor

### Public (standalone, no sidebar)
- `/profile/:slug` - Advisor profile page
- `/profile/:slug/request-callback` - Callback request form
- `/profile/:slug/referrals` - Referral form

## API Routes
- `GET /api/dashboard/stats` - Dashboard summary counts
- `GET /api/dashboard/activity` - Weekly activity data
- `GET /api/advisors` - List all advisors
- `GET /api/advisors/slug/:slug` - Lookup advisor by slug
- `POST /api/advisors` - Create advisor
- `PATCH /api/advisors/:id` - Update advisor
- `PATCH /api/advisors/:id/toggle` - Toggle active/inactive
- `GET /api/emails` - List all emails with advisor names
- `POST /api/emails` - Create email record (auto-grades)
- `PATCH /api/emails/:id/grade` - Update email grade
- `POST /api/referral` - Referral submission (auto-grades, stores referrer info)
- `POST /api/callback` - Callback request (auto-grades)
- `POST /api/webhook/zoho` - Zoho Mail webhook
- `POST /api/webhook/inbound-email` - SendGrid Inbound Parse
- `POST /api/stats/access` - Record app access
- `POST /api/upload/profile-pic` - Upload profile picture (returns URL)

## File Structure
- `shared/schema.ts` - Drizzle schema, autoGradeClient(), BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES, TITLE_OPTIONS
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with CRUD operations
- `server/routes.ts` - Express API routes
- `server/sendgrid.ts` - SendGrid email utility
- `client/src/pages/` - HomePage, Dashboard, CIV, ManageAdvisors, CreateAdvisor, EditAdvisor, AdvisorProfile, CallbackForm, ReferralForm
- `client/src/lib/themeUtils.ts` - Shared theme color utility (dark/blue/pink) used by all public pages
- `client/src/components/layout/AppLayout.tsx` - Black sidebar with "Control Panel" text, no logo

## UI Conventions
- **No emojis anywhere in the UI.** All icons must be Lucide React icons (X, Check, AlertTriangle, CalendarDays, Coffee, etc.). The single exception is canvas-rendered images (e.g. downloadable business card) and printable HTML reports — those use plain text labels like "Tel", "Email", "Note:" instead of emoji glyphs.
- Warning/alert messages use `AlertTriangle` icon paired with descriptive text.
- Close buttons use `X` icon with `aria-label="Close"`.
- Checkmarks (password rules, completion states) use `Check` icon, not Unicode "✓".
- Lead form follow-up paragraphs (Will request, Callback, Referral) avoid "yesterday/today" phrasing — use future-conditional ("If something were to happen tomorrow…") to keep tone supportive without alarming.
- Ordinal labels for repeating items (referrals 1–20) use word form for First–Tenth, then numeric with proper suffix logic (11th–13th, 21st, etc.).

## Legal Pages
- `/privacy-policy` and `/terms` rendered by `client/src/pages/LegalPage.tsx` (POPIA-compliant, last updated 27 April 2026, includes 90-day Lead Protection Commitment).
- Privacy notice line above submit on all three lead forms (`CallbackForm`, `ReferralForm`, `WillForm`) — required for POPIA-compliant data collection.
- Privacy + Terms footer links on `AdvisorProfile` (public profile), `AdvisorPanel` (advisor sub-control panel), and master admin `Login`.
- Downloadable contact card image (canvas-rendered in `AdvisorProfile.tsx`) carries footer text `advisoryconnect.pro/privacy-policy` baked into the PNG.
## Saturday Batch (S1–S7)
- **S1 Forex 24hr deltas**: server stamps daily snapshot in `forex_daily`, `/api/forex/rates` returns prev rates; ForexWidget shows ±%, green = Rand strengthened, red = Rand weakened.
- **S2 QR enlargement**: QR block on public profile resized to fill the contact-card column.
- **S3 Registry temperature sort**: Added "Temperature" SortKey in CIVTab — Hot → Warm → Cold → null (asc reverses).
- **S4 Add to Home Screen**: dynamic `/api/manifest` keyed by current advisor slug; `<link rel="manifest">` swapped per profile so iOS pins THAT page.
- **S5 FAIS / advisor code / email persistence**: Root cause was `PUBLIC_ADVISOR_FIELDS` allowlist in `server/routes.ts` stripping `email`, `advisorCode`, `faisAgreementUrl` from the public lookup. All three added.
- **S6 Secondary card parity**: `AdditionalProfileForm` now takes the parent `Advisor` and renders a read-only "Inherited from Primary" sub-section after its own toggles, exposing the 6 advisor-row toggles (showSecondNews/Forex/FunFacts/Liberty/Stanlib/Signinghub) so secondaries clearly show what they inherit.
- **S7 Views relocation + P/S split (NO schema change)**:
  - Public-facing views badge removed from `AdvisorProfile.tsx`.
  - Slug attribution encoded in `stats.eventType` as `app_access:<slug>` (sanitised). Legacy untagged `app_access` rows fold into Primary; unknown tagged slugs also fold into Primary.
  - New endpoints: `GET /api/advisors/:slug/profile-stats` returns `{totalViews, primaryViews, secondaryViews}`; `GET /api/advisors/:slug/views-series` returns 7-day series `[{name, primary, secondary}]`. Both whitelisted in `ADVISOR_SLUG_ROUTE_PATTERN`. `views-series` is owner-gated via `canAccessAdvisor(req, advisor.id)` so requests from either Primary or Secondary slug URLs work for the logged-in owner.
  - New storage methods: `getAdvisorViewCountsSplit`, `getAdvisorViewSeries`. `getAdvisorViewCount` now matches both legacy and new eventTypes.
  - Panel UI: ProfilesTab "My Profiles" header shows `Views: Primary N · Secondary M` badge; StatsTab adds an AreaChart (green = Primary `#22c55e`, blue = Secondary `#3b82f6`) above the existing Leads bar chart.
- **DEFERRED (next session)**: Forex graph (8th item from partner meeting).

## "Buckle Up" Batch (M1–M6, May 2026)
Stewart's change-notes batch from the May post-meeting list. Items M1–M4 shipped earlier in the same session (see commit 36e20ec). M5 + M6 close it out.

- **M5(a) Toolbox alignment**: `ToolboxTab.DEFAULT_TOOL_ORDER` reordered to `["tax","er","ci","pension","cgt","vehicle","std","forex","scan","cal","media"]` so the panel's tool list visually mirrors the public-profile financial-tools order. localStorage key bumped `advisorToolboxOrder` → `advisorToolboxOrder_v2` with a one-time **lossless migration**: existing custom orders are read from the legacy key, filtered to known IDs, padded with any defaults the advisor was missing, then written into the new key. Legacy key is intentionally left intact for rollback safety.
- **M5(b) Interactive Tools accordion**: 4th HomeTab card (icon = `Zap`, accent `#F59E0B`) renders `InteractiveToolsTab` — master switch (`showInteractive`) plus 6 individual showpiece toggles (Squeeze / Tax Bite / Inflation / Waiting / Reality / Latte). PATCHes `/api/advisors/:id` and invalidates queries. **NB**: same unauth gap as other advisor PATCH routes (see "Known Auth Gap" below) — not introduced by this batch but inherited.
- **M6 Secondary editor parity (`AdditionalProfileForm`)**:
  - **6 missing toggle state vars + payload entries** added: `showShowpieceInflation`, `showShowpieceWaiting`, `showToolBond`, `showToolEmergency`, `showToolLifeCover`, `showToolDebt`. Without these the secondary couldn't enable the calculator/showpiece additions that exist on the primary.
  - **Header Image card** added with two PNG download buttons (Header PNG + Profile Card PNG). Uses inherited `advisor.name` for display since name is single-source-of-truth on the advisor row. Powered by new module-level helpers `downloadHeaderBadgePng` / `downloadProfileImagePng` extracted above `ProfileTab` so both editors can call them. Primary's older in-component `handleDownloadBadge`/`handleDownloadProfileImage` were intentionally NOT refactored to the helpers in this pass — both still work; refactor deferred to keep the diff scoped.
  - **JSX reorder** to mirror primary exactly: Profile URL → Header & Title → Profile Picture → **Header Image (NEW)** → Bio → Individual Services → Corporate Services → Social Links → Contact Details (inherited) → Admin Notes → Profile Page Elements → Theme Colour (with new explanatory paragraph) → Section Order → Background Pattern. (Was: ... → Theme → Background → Profile Elements → Section Order.)
  - **Profile Page Elements** sub-lists now expose all 4 missing calculator toggles + 2 missing showpiece toggles so secondary's element list reads identically to primary.
- **Server `PUBLIC_ADVISOR_FIELDS` extended** in `server/routes.ts` with the 6 new toggle keys (Inflation/Waiting/Bond/Emergency/LifeCover/Debt). Required because the primary editor and `InteractiveToolsTab` both initialise from `/api/advisors/slug/:slug`; without the allowlist entries the panel reads them as `undefined`, then the `!== false` defaulting flips them back to `true` on save (same class of regression as the S5 email/advisorCode strip).
