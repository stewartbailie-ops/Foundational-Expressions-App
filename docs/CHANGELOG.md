# Advisory Connect — Changelog

Historical batch logs trimmed out of `replit.md` (which now keeps only architecture and active operational context). Each item below is shipped + verified — listed so we know it exists, not how it's wired. Read the code if you need internals.

---

## Build History — Phases 1–5 (April 2026)

### CIV / Lead Registry
- Lead temperature glow on CIV rows (Phase 1 → 5: started as 4px left bar + tint, ended as full surround `boxShadow` ring + ambient glow on AdvisorPanel cards). Hot=red / Warm=amber / Cold=sky, sourced from `email.leadTemperature`.
- CSV export `GET /api/emails/export.csv` (admin-protected, formula-injection-safe with `'` prefix for `=+-@`, UTF-8 BOM).
- Registry enhancements: double-click column-header sort, date range filter, unread blue dot + bold rows + count badge, "New" unread-only quick filter pill.
- Active / Archived tab split (CIV + AdvisorPanel). Archived view hides status filter row, shows `archivedAt`.
- Enhanced timestamps on `emails`: `firstViewedAt`, `lastViewedAt`, `archivedAt`. Admin opens bump `lastOpenedAt`; advisor opens bump `firstViewedAt` + `lastViewedAt`. `updateEmailStatus` sets/clears `archivedAt` on Archive transitions.
- Grader 2.0 indicators (Hot/Warm/Cold pill + numeric `leadScore`) shown on AdvisorPanel lead-card headers.

### Profile / Advisor Panel content
- Daily fun facts carousel (`FunFactsCarousel.tsx`, `client/src/data/funFacts.ts`, 300 facts → `getDailyFacts()` deterministic 6-per-day, 8-colour category palette in `FUN_FACT_CATEGORY_COLORS`). Behind `showFunFacts` toggle.
- Live forex widget (`ForexWidget.tsx` + `GET /api/forex/rates` proxy of api.frankfurter.app, 60s cache, stale-on-failure). Behind `showForex` toggle.
- Secondary news feed: extended `/api/news/feed` `SOURCES_BY_CAT` with `secondary` category (BBC Africa + MarketWatch + Investing.com FX — SA-domestic feeds were bot-blocked by Cloudflare). Behind `showSecondNews` toggle.
- All three new sections added to `DEFAULT_PROFILE_SECTION_ORDER` + `PROFILE_SECTION_LABELS`, surface as toggles in ProfileTab "Profile Page Elements", added to `PUBLIC_ADVISOR_FIELDS` allowlist in `server/routes.ts`. AdvisorPanel HomeTab shows live previews of all three, gated by the same toggles.
- Per-platform public-card toggles: `showLiberty`, `showStanlib`, `showSigninghub` (default false, opt-in). Single source of truth `PLATFORMS_META` in `shared/schema.ts` shared by AdvisorPanel `PlatformsTab` + AdvisorProfile public section. Public section auto-hides when all 3 flags off.
- Contact card button regrouping on AdvisorProfile: 3 stacked rows ("Get in touch" / "Share & save" / "Install"), Save Contact promoted to primary CTA.
- "Add to Home Screen" guidance card at top of AdvisorPanel SettingsTab (iOS + Android numbered steps, static markup).

### Infrastructure / Quality
- CSP violation reporting: `reportUri: ["/api/csp-report"]` in Helmet, endpoint accepts `application/csp-report` + `application/reports+json`, ring-buffers last 50 violations, logs as `[CSP] Violation: directive="..." blocked="..."`. Returns 204.
- Bundle splitting: `vite.config.ts` `manualChunks` splits radix/lucide/forms/query/react-dom/react+wouter/date-fns/recharts into vendor chunks. `App.tsx` lazy-loads admin + low-traffic public pages inside `<Suspense>` (hot-path public pages stay eager). Main chunk: 1,567 → 371 kB (433 → 108 kB gzip). `chunkSizeWarningLimit: 600`.
- SA English wording sweep across `shared/schema.ts` `INDIVIDUAL_SERVICES` + `client/src/pages/AdvisorProfile.tsx` fallbacks (Optimize → Optimise, minimize → minimise, etc.).

---

## Saturday Batch (S1–S7, April–May 2026)

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

---

## "Buckle Up" Batch (M1–M6 + F5, May 2026)

Stewart's change-notes batch from the May post-meeting list. Items M1–M4 shipped earlier in the same session (see commit 36e20ec). M5 + M6 close it out; F5 added the footer cleanup at the end.

- **M5(a) Toolbox alignment**: `ToolboxTab.DEFAULT_TOOL_ORDER` reordered to `["tax","er","ci","pension","cgt","vehicle","std","forex","scan","cal","media"]` so the panel's tool list visually mirrors the public-profile financial-tools order. localStorage key bumped `advisorToolboxOrder` → `advisorToolboxOrder_v2` with a one-time **lossless migration**: existing custom orders are read from the legacy key, filtered to known IDs, padded with any defaults the advisor was missing, then written into the new key. Legacy key is intentionally left intact for rollback safety.
- **M5(b) Interactive Tools accordion**: 4th HomeTab card (icon = `Zap`, accent `#F59E0B`) renders `InteractiveToolsTab` — master switch (`showInteractive`) plus 6 individual showpiece toggles (Squeeze / Tax Bite / Inflation / Waiting / Reality / Latte). PATCHes `/api/advisors/:id` and invalidates queries. **NB**: same unauth gap as other advisor PATCH routes (see "Known Auth Gap" in `replit.md`) — not introduced by this batch but inherited.
- **M6 Secondary editor parity (`AdditionalProfileForm`)**:
  - **6 missing toggle state vars + payload entries** added: `showShowpieceInflation`, `showShowpieceWaiting`, `showToolBond`, `showToolEmergency`, `showToolLifeCover`, `showToolDebt`. Without these the secondary couldn't enable the calculator/showpiece additions that exist on the primary.
  - **Header Image card** added with two PNG download buttons (Header PNG + Profile Card PNG). Uses inherited `advisor.name` for display since name is single-source-of-truth on the advisor row. Powered by new module-level helpers `downloadHeaderBadgePng` / `downloadProfileImagePng` extracted above `ProfileTab` so both editors can call them. Primary's older in-component `handleDownloadBadge`/`handleDownloadProfileImage` were intentionally NOT refactored to the helpers in this pass — both still work; refactor deferred to keep the diff scoped.
  - **JSX reorder** to mirror primary exactly: Profile URL → Header & Title → Profile Picture → **Header Image (NEW)** → Bio → Individual Services → Corporate Services → Social Links → Contact Details (inherited) → Admin Notes → Profile Page Elements → Theme Colour (with new explanatory paragraph) → Section Order → Background Pattern.
  - **Profile Page Elements** sub-lists now expose all 4 missing calculator toggles + 2 missing showpiece toggles so secondary's element list reads identically to primary.
- **Server `PUBLIC_ADVISOR_FIELDS` extended** in `server/routes.ts` with the 6 new toggle keys (Inflation/Waiting/Bond/Emergency/LifeCover/Debt). Required because the primary editor and `InteractiveToolsTab` both initialise from `/api/advisors/slug/:slug`; without the allowlist entries the panel reads them as `undefined`, then the `!== false` defaulting flips them back to `true` on save (same class of regression as the S5 email/advisorCode strip).
- **F5 Footer flatten**: `client/src/components/BrandFooter.tsx` reshaped from a two-row card (centered tagline on top, logo + pills underneath) into a single balanced horizontal row per partner sample — logo left, tagline + Privacy/Terms in the middle, `advisoryconnect.pro` + `Contact Support` pills on the right. Centering uses an absolute-positioned middle block so the text is mathematically centred regardless of left/right widths, with a stacked `sm:` fallback on narrow viewports so nothing collides on mobile. Single-component refactor cascades to all three places it's mounted (`AppLayout`, `AdvisorPanel`, `AdvisorProfile`).
