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

## Phase 4 Build Queue (April 2026, completed)
- **W2.3 — Daily financial fun facts**: New `client/src/components/FunFactsCarousel.tsx` reads `getDailyFacts()` from `client/src/data/funFacts.ts` (300 facts, 6-per-day deterministically seeded by date — same 6 all day, rotates at midnight). Each card renders with category-tinted dark background (8-colour palette in `FUN_FACT_CATEGORY_COLORS` map in `shared/schema.ts` — Tax teal / Retirement purple / Wills slate / Investment navy / Budgeting green / Insurance maroon / Property brown / Medical Aid rose), category pill, fact text, plus Share + Copy buttons. Share uses Web Share API where available with clipboard fallback; Copy is clipboard-only. Cards live in a horizontal snap-scroll row so mobile can swipe through the 6. Behind a new dedicated `showFunFacts` toggle (default false — opt-in).
- **W2.1 — Live forex widget**: New `GET /api/forex/rates` endpoint proxies api.frankfurter.app (no key, free, reliable), returns USD/EUR/GBP per ZAR (inverted from frankfurter's ZAR base), 60s in-memory cache so the upstream isn't hammered, serves stale-on-failure rather than nothing. New `client/src/components/ForexWidget.tsx` polls every 60s, shows the 3 pairs in a compact 3-column grid with up/down/flat trend indicator (compares against previous fetch). Behind a new `showForex` toggle (default false). Added `/api/forex/` to `PUBLIC_API_ROUTES` in `server/auth.ts` so the global `requireAuth` middleware lets it through.
- **W2.2 — Secondary news feed**: Extended `/api/news/feed` `SOURCES_BY_CAT` with a new `secondary` category. Originally aimed at SA-domestic feeds (BusinessTech / Daily Investor / Fin24) but all three are bot-blocked by Cloudflare/Akamai (403/301/302) — pivoted to a working mix of BBC Africa + MarketWatch top stories + Investing.com FX news, all of which serve their RSS reliably with our existing browser UA. Behind a new `showSecondNews` toggle (default false). Reuses the existing `<NewsHero>` component with `category="secondary"` + `labelOverride="More Finance News · Live"`.
- **All three new sections**: added to `DEFAULT_PROFILE_SECTION_ORDER` (`secondnews` and `forex` slot in just after `moneyweb`, `funfacts` after `interactive`) and to `PROFILE_SECTION_LABELS`. New 3 toggles surface in ProfileTab "Profile Page Elements" card. All 3 fields added to `PUBLIC_ADVISOR_FIELDS` allowlist in `server/routes.ts` (the lesson from Phase 3 — without this, the public profile API would strip them).
- **Migration**: db:push --force still upstream-broken (same drizzle-kit beta vs drizzle-orm 0.45 `_relations` issue from W2.6 / W3.2); fell back to additive `ALTER TABLE advisors ADD COLUMN IF NOT EXISTS show_fun_facts/show_forex/show_second_news BOOLEAN DEFAULT false`. No PK changes.

## Phase 3 Build Queue (April 2026, completed)
- **W3.1 — Contact card button regrouping**: AdvisorProfile.tsx utility-button row split into 3 stacked groups with vertical breathing space — Row 1 "Get in touch" (Save Contact + WhatsApp Me), Row 2 "Share & save" (Share Profile + Save Business Card), Row 3 "Install" (Save to Home Screen full-width). Save Contact promoted to primary (filled) since it's the dominant CTA. PNG generator (lines ~834-950) untouched — printable card never had buttons.
- **W3.2 — Per-platform public-card toggles**: 3 new nullable boolean columns on `advisors` (`showLiberty`, `showStanlib`, `showSigninghub`, all default false — opt-in so existing public cards don't change). Hoisted platform metadata to a single `PLATFORMS_META` const in `shared/schema.ts` (key/name/description/url/colorHex/showField/iconKey) — both AdvisorPanel `PlatformsTab` (advisor-private dashboard) and AdvisorProfile public section now read from this one source of truth. Added `platforms` to `DEFAULT_PROFILE_SECTION_ORDER` (last) and `PROFILE_SECTION_LABELS` ("Financial Platforms"). Public section auto-hides when all 3 flags are off (returns null). New 3 toggles surface in ProfileTab "Profile Page Elements" card. Migration: db:push --force still blocked by drizzle-kit beta vs drizzle-orm 0.45 `_relations` upstream incompatibility (same pre-existing condition as W2.6); fell back to additive `ALTER TABLE advisors ADD COLUMN IF NOT EXISTS show_x BOOLEAN DEFAULT false` — no PK changes.
- **W2.8 — Add to Home Screen guidance card**: Slim instructional card at the top of AdvisorPanel `SettingsTab` return, with side-by-side iOS (Safari) + Android (Chrome) numbered steps. Static markup, no JS install prompt — works on every browser the advisor might use.

## Phase 2 Build Queue (April 2026, completed)
- **W2.6 — Enhanced timestamps**: Added `firstViewedAt`, `lastViewedAt`, `archivedAt` to `emails` table.
  - `PATCH /api/emails/:id/open` branches on `req.session.authenticated`: admin sessions still bump `lastOpenedAt` only; advisor sessions bump `firstViewedAt` (if null) + `lastViewedAt`. Admin views in CIV no longer pollute the advisor's view tracking.
  - Storage: new `updateEmailViewedByAdvisor(id)` method. `updateEmailStatus` now sets `archivedAt = now()` on transition INTO Archive and clears it on transition OUT.
  - AdvisorPanel: `isUnread` and panel-root `unreadCount` now key off `lastViewedAt`. "Last viewed" labels swapped accordingly.
  - CIV `lastOpenedAt` semantics unchanged (admin tracking).
- **W2.5 — Lead Registry archiving tab**: Both CIV and AdvisorPanel now have a top-level Active / Archived tab pair.
  - Archived leads (`leadStatus === "Archive"`) are hidden from the active view by default.
  - "Archive" card removed from the 3-card status filter row in active mode (now 2 cards: Need to Contact, Contacted). Status row hidden entirely in archived view.
  - Archived rows show the `archivedAt` date alongside `receivedAt`.
  - Switching to Archived view resets statusFilter and clears expanded rows.
- **W3.6 — Grader 2.0 indicators on sub-profiles**: AdvisorPanel lead card headers now show a Hot/Warm/Cold temperature pill (red/amber/sky — same colour language as CIV W2.9 row glow) plus the numeric `leadScore` next to the existing Grade badge. Both fields read directly from the data already populated by Grader 2.0; no scoring changes.

## Phase 1 Build Queue (April 2026, completed)
- **W2.9 — Lead temperature glow**: CIV row tint + 4px coloured left bar from `tempRowGlow`/`tempCellAccent` (Hot=red, Warm=amber, Cold=sky), driven by `email.leadTemperature`. Falls back to default hover when null.
- **W2.7 — CSV export**: `GET /api/emails/export.csv` (admin-session protected). Returns UTF-8 BOM + comma CSV with all 30 lead fields. Cells starting with `=`, `+`, `-`, `@` are prefixed with `'` to neutralise CSV-formula injection in Excel/Sheets. Frontend "Export CSV" button in CIV header.
- **W3.7 — Registry enhancements**: Double-click column headers to sort (toggles asc/desc, ChevronUp/Down indicator). Date range filter (from/to local-time inputs). Unread blue glowing dot + bold row text + total unread count badge. State held in CIV.tsx; date filter is local-time which matches the local-time row display.
- **W1.3 — Bundle splitting**: `vite.config.ts` `build.rollupOptions.output.manualChunks` splits radix/lucide/forms/query/react-dom/react+wouter/date-fns/recharts into separate vendor chunks. `App.tsx` lazy-loads admin pages (HomePage, Dashboard, CIV, ManageAdvisors, CreateAdvisor, EditAdvisor) + low-traffic public pages (AdvisorPanel, LegalPage) inside a `<Suspense>` boundary. Hot-path public pages (AdvisorProfile, CallbackForm, ReferralForm, WillForm, Login) stay eager. Result: main chunk 1,567 → 371 kB (433 → 108 kB gzip). `chunkSizeWarningLimit` raised to 600.

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