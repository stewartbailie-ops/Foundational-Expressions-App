# Advisory Connect — Project Handoff

> **Read this first.** This document is the single source of truth for understanding what Advisory Connect is, how it's built, how it runs, and where the bodies are buried. Pair it with `CURRENT_STATE.md` for "what's happening right now".

---

## 1. Project Description & Purpose

**Advisory Connect** is a multi-tenant SaaS platform for South African financial advisors. It gives each advisor:

- A **public, mobile-optimised digital business card** (e.g. `advisoryconnect.pro/stewart-bailie`) that they share with clients via QR code, email signature, WhatsApp, etc.
- A **personal mini control panel** (e.g. `app.advisoryconnect.pro/advisor/stewart-bailie`) where they manage their profile, theme, services, financial tools, and incoming leads.
- An **admin master control panel** (`app.advisoryconnect.pro`) used by the platform owner to manage all advisors, view aggregate stats, and oversee the system.

The platform captures three kinds of inbound leads from each public profile:
1. **Call Back requests** — client wants to be contacted.
2. **Referrals** — third party referring a friend/family/colleague.
3. **Will Requests** — client requesting the complimentary will service.

Leads are **auto-graded** (Gold / Silver / Bronze / Development) by income and age, and surfaced in a per-advisor **CIV (Client Information Viewer)**.

---

## 2. Tech Stack

### Languages
- **TypeScript 5.6** (frontend + backend, single repo)
- **SQL** (PostgreSQL via Drizzle ORM — no raw SQL in app code)

### Runtime
- **Node.js 20+**
- **PostgreSQL 16** (Neon-serverless friendly)

### Frontend
| Library | Version | Purpose |
|---|---|---|
| `react` / `react-dom` | 19.2 | UI |
| `vite` | 7.1 | Dev server + bundler |
| `@vitejs/plugin-react` | 5.0 | React fast-refresh |
| `wouter` | 3.3 | Lightweight client-side routing |
| `@tanstack/react-query` | 5.60 | Server-state cache |
| `react-hook-form` + `@hookform/resolvers` + `zod` | latest | Forms + validation |
| `tailwindcss` | 4.1 | Utility CSS |
| `tailwindcss-animate`, `tw-animate-css` | latest | Animation helpers |
| `@radix-ui/react-*` | latest | Headless primitives behind `shadcn/ui` |
| `lucide-react` | 0.545 | Icons |
| `recharts` | 2.15 | Dashboard charts |
| `qrcode.react` | 4.2 | QR generation on profile cards |
| `framer-motion` | 12.23 | Page / element transitions |
| `react-google-recaptcha` | 3.1 | Soft spam protection on public forms |
| `sonner` | 2.0 | Toast notifications |
| `embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `react-day-picker` | latest | UX primitives |

### Backend
| Library | Version | Purpose |
|---|---|---|
| `express` | 5.0 | HTTP server |
| `express-session` | 1.19 | Session middleware |
| `connect-pg-simple` | 10.0 | PostgreSQL session store (auto-creates `session` table) |
| `drizzle-orm` + `drizzle-zod` + `drizzle-kit` | 0.39 / 0.7 / 0.31 | ORM + schema-to-zod + migrations |
| `pg` | 8.16 | Postgres driver |
| `@sendgrid/mail` | 8.1 | Transactional email |
| `multer` | 2.1 | Profile-pic file uploads |
| `bcryptjs` | 3.0 | Per-advisor password hashing |
| `passport` + `passport-local` | 0.7 / 1.0 | Per-advisor auth strategy |
| `docx` | 9.6 | Server-side .docx generation (NDA / FAIS docs) |
| `tsx` | 4.20 | TypeScript runner for dev/prod entry |
| `esbuild` | 0.25 | Server bundling for production |

---

## 3. Architecture Overview

```
                ┌────────────────────────────────────────────────────┐
                │                  CUSTOM DOMAINS                    │
                │                                                    │
                │   advisoryconnect.pro         app.advisoryconnect.pro
                │   (public profiles)           (admin + advisor panel)
                └─────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
                ┌────────────────────────────────────────────────────┐
                │              REPLIT DEPLOYMENT (Express)           │
                │                                                    │
                │  ┌──────────────────────────────────────────────┐  │
                │  │ server/index.ts — bootstraps express,        │  │
                │  │ sessions (PG-backed), vite dev/prod static   │  │
                │  └──────────────────────────────────────────────┘  │
                │  ┌──────────────────────────────────────────────┐  │
                │  │ server/auth.ts — global requireAuth middlewr │  │
                │  │   PUBLIC_API_ROUTES whitelist gates rest     │  │
                │  └──────────────────────────────────────────────┘  │
                │  ┌──────────────────────────────────────────────┐  │
                │  │ server/routes.ts — all REST endpoints (~894L)│  │
                │  │   Validates with zod, calls storage layer    │  │
                │  └──────────────────────────────────────────────┘  │
                │  ┌──────────────────────────────────────────────┐  │
                │  │ server/storage.ts — IStorage abstraction +   │  │
                │  │   Drizzle implementation (PG)                │  │
                │  └──────────────────────────────────────────────┘  │
                │  ┌──────────────────────────────────────────────┐  │
                │  │ server/sendgrid.ts — email send + recipients │  │
                │  └──────────────────────────────────────────────┘  │
                │                       │                            │
                │                       ▼                            │
                │              ┌─────────────────┐                   │
                │              │   PostgreSQL    │                   │
                │              │  (DATABASE_URL) │                   │
                │              └─────────────────┘                   │
                └────────────────────────────────────────────────────┘
                                      │
                                      ▼
                ┌────────────────────────────────────────────────────┐
                │                    REACT SPA                        │
                │                                                    │
                │  client/src/App.tsx — wouter router                │
                │  ├─ Public routes (no AppLayout, no auth)          │
                │  │   /[slug], /profile/:slug/request-callback,     │
                │  │   /profile/:slug/referrals, /profile/:slug/will │
                │  └─ Admin routes (AppLayout + login required)      │
                │      /, /stats, /civ, /manage, /create, /edit/:id, │
                │      /advisor/:slug (advisor mini-panel)           │
                └────────────────────────────────────────────────────┘
```

### Key flows

**Public profile render** (`advisoryconnect.pro/[slug]`)
1. Browser hits Express; vite/static serves the SPA shell.
2. `AdvisorProfile.tsx` loads, calls `GET /api/advisors/slug/:slug` (whitelisted as public).
3. If the slug matches an `additional_profile`, that record's overrides are merged on top of the parent advisor's defaults (secondary inheritance pattern — see §6).
4. Theme palette resolved via `client/src/lib/themeUtils.ts` (12 themes × 6 background patterns).
5. Forms post to `/api/callback`, `/api/referral`, `/api/will-request` (all public).

**Lead capture & grading**
1. Public form posts JSON to corresponding endpoint.
2. Endpoint validates with zod, calls `storage.createEmail(...)`.
3. `autoGradeClient(age, income)` in `shared/schema.ts` assigns Gold/Silver/Bronze/Development.
4. If SendGrid is configured, a notification email is sent to the advisor (and any cc recipients).
5. Lead becomes visible in the **CIV** for both the master admin and the owning advisor.

**Auth**
- **Master admin**: `POST /api/auth/login` with `ADMIN_EMAIL` + `ADMIN_PASSWORD`. Sets `req.session.authenticated = true`. Lasts 7 days. Sessions stored in PG via `connect-pg-simple`.
- **Per-advisor**: `POST /api/advisor-auth/...` (passport-local strategy, bcrypt hashes in `advisors.advisor_password_hash`). Sets `req.session.advisor_${slug} = true`.
- `server/auth.ts::requireAuth` is mounted globally on `/api/*` and exempts a `PUBLIC_API_ROUTES` whitelist plus the `/uploads/*` static directory.

---

## 4. Current Feature List

### ✅ Working in production
- **Master admin control panel** (`app.advisoryconnect.pro`) with Home, Stats, CIV, Manage Advisors, Create Advisor, Edit Advisor.
- **Per-advisor mini control panel** (`/advisor/:slug`) with Profile, CIV, Settings, Tools-toggle, Theme picker, Background pattern picker.
- **Public mobile-first contact card** (`/[slug]`) with QR code, services accordion, social links, financial tools, callback/referral/will buttons.
- **3 lead-capture forms**: Call Back, Referral, Will Request — all public, all reCAPTCHA-soft-protected.
- **Auto-grading** of leads (Gold/Silver/Bronze/Development) by age + income.
- **CIV** with grade tiles, search, filter pills (All / Referrals / Call Backs / Wills), expandable rows, inline grade override, lead-status workflow (Need to Contact → Contacted → Archive).
- **12 themes** × **6 background patterns** with intensity slider (5–100% opacity).
- **2 profiles per advisor** (Primary + Secondary) — secondary inherits unset fields from primary by design.
- **6 financial calculators on public card** (SA Tax, Exchange Rate, Compound Interest, Pension, CGT, Vehicle Finance) — each individually toggleable per profile.
- **ZAR Rate Table** in advisor toolbox showing live rates against top 10 currencies.
- **Multi-step setup wizard** for new advisors (terms acceptance, password set, profile populate).
- **Custom domain support**: `advisoryconnect.pro` (apex, public profiles) + `app.advisoryconnect.pro` (admin).
- **SendGrid email notifications** on every lead.
- **Admin email + password rotation** via env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) — no code change needed to swap.
- **Profile picture uploads** via multer to `/uploads/`.
- **Server-side .docx generation** for NDA / FAIS agreements.
- **Three-language support** stub on public card (English, Afrikaans, isiZulu translations of "Powered by Advisory Connect").

### 🧪 In progress / partially built
- **CIV upgrades** (next planned focus — see `CURRENT_STATE.md`).
- **Authz middleware on advisor CRUD** — currently the admin session is the only gate; deferred per scratchpad.
- **Subscription tier enforcement** — `subscriptionTier` field exists (`trial` / `standard` / `premium`) but no feature gating yet.

### 🗺️ Planned / not yet started
- Bulk-delete UI for test leads in CIV.
- Scheduled email digests of new leads.
- Webhook integrations (Zoho, SendGrid Inbound Parse stubs exist but unused).
- Cover image / banner customisation on public cards (`coverImageUrl` field exists; not yet rendered).
- Per-advisor analytics dashboard inside the mini control panel.

---

## 5. Known Bugs & Issues

| # | Severity | Description |
|---|---|---|
| 1 | Low | `client/src/lib/themeUtils.ts` line 319-327 still falls back to hard-coded `#4a8db5` (legacy blue). Should use a neutral fallback. |
| 2 | Low | `AdvisorPanel.tsx` is **5,072 lines** — overdue for componentisation; navigating it is painful. |
| 3 | Low | Secondary profiles "look identical" to primary in some places — this is **by design** (inheritance), not a bug, but it confuses users. Worth a UI cue. |
| 4 | Low | `DELETE /api/emails/:id` has no auth in dev code but production session enforces it via global `requireAuth`. Bulk-delete script must run from a logged-in browser DevTools console (see `CURRENT_STATE.md`). |
| 5 | Info | Production database is **read-only** when accessed via the agent's `executeSql` tool with `environment: "production"`. All writes must go through deployed API endpoints. |
| 6 | Info | **Never run `npm run db:push` against production** — the team uses manual `ALTER TABLE` for new columns to avoid destructive changes. |

---

## 6. Important Decisions & Context

### Schema & data
- **Two profile tables**: `advisors` (primary) and `advisor_profiles` (secondary). A "secondary" inherits any unset field from the parent advisor at render time — this is *intentional* so advisors don't have to re-enter contact details.
- **Why `advisor_profiles` and not `additional_profiles`**: the schema name is `advisor_profiles`. Some legacy code/comments still say "additional" — search for both when refactoring.
- **`emails` table holds all leads** (callbacks, referrals, wills) — discriminated by the `type` column. This was a deliberate consolidation; one query feeds the CIV instead of three.
- **Drizzle schema in `shared/schema.ts`** is shared with the frontend — types flow through `@shared/schema` import alias.
- **Lead grading logic** (`autoGradeClient`) lives in `shared/schema.ts` so both frontend (preview) and backend (canonical) compute identically.
- **Income parsing** (`parseIncomeToNumber`) extracts the first number from strings like `"R45k - R60k"` — that's why `R75k+` grades Gold and `R45k+` grades Silver.

### Auth
- **Single shared admin password** (not per-user) — `ADMIN_PASSWORD` secret. Designed for a single-operator platform.
- **Per-advisor passwords** are bcrypt-hashed in the `advisors` table — used for the advisor mini panel.
- **Global auth middleware with public whitelist** beats per-route guards for this app's size — easier to audit which routes are public.

### UX / theming
- **Master panel is solid black** with `rgba(255,255,255,0.06)` glass tiles and `rgba(255,255,255,0.10)` borders + white text. Established for brand consistency and contrast.
- **Inner-card surfaces always use a dark-glass palette** regardless of the host's theme — guarantees button text stays legible across all 12 themes.
- **Public card uses theme gradients** for the outer card; inner action buttons (Copy/Share, View Profile) are solid white with theme-accent bold text — guaranteed contrast.
- **Primary/Secondary badge** is now absolute-positioned in the top-right of the card (was clipping on narrow phones in a flex grid).

### Deployment
- **Two domains, one app** — apex serves public profiles, `app.` serves admin. Same deployment, same DB.
- **HTTPS auto-issued** by Replit on domain link.
- **Production seeded data** for testing lives under advisor IDs 17 and 24 (Stewart Bailie). Test lead IDs 35–117 should be wiped before launch (the user is doing this manually).

### Things that look like bugs but are intentional
- Secondary profile sharing primary's contact info (inheritance — see above).
- Will Requests showing `undefined` grade in admin lists — they don't get auto-graded; they're a service request, not a lead.

---

## 7. Environment Variables / Secrets

Set these in Replit Secrets (or your platform of choice). All are required for full functionality except where noted.

| Name | Type | Required | Purpose |
|---|---|---|---|
| `DATABASE_URL` | secret | ✅ Yes | PostgreSQL connection string. Auto-provisioned by Replit. |
| `ADMIN_PASSWORD` | secret | ✅ Yes | Master admin login password. Also used as session secret. |
| `ADMIN_EMAIL` | env var | ⚠️ Recommended | Master admin login email. Falls back to `info@corefinancials.org` if unset. Currently set to `info@advisoryconnect.pro` in production. |
| `SENDGRID_API_KEY` | secret | ⚠️ Recommended | SendGrid API key for outbound notifications. Email sends silently no-op if missing. |
| `RECAPTCHA_SECRET_KEY` | secret | ⚠️ Optional | Server-side reCAPTCHA verification. Forms submit fine without it (soft-fail). |
| `SESSION_SECRET` | env var | ⚠️ Optional | Override for session cookie signing. Falls back to `ADMIN_PASSWORD` then a literal string. |

> **Never display secret values.** Use the secrets manager UI to rotate. The agent has a `requestEnvVar` capability that prompts the user to paste new values securely (no chat exposure).

---

## 8. Local Setup & Run

### Prerequisites
- Node.js 20 or newer
- A PostgreSQL 16 database (Neon, local, or Replit-managed)

### Install & start
```bash
# 1. Install all dependencies
npm install

# 2. Make sure your env has DATABASE_URL set
#    e.g. export DATABASE_URL="postgres://user:pass@host:5432/db"

# 3. Push the Drizzle schema to your database (FIRST RUN ONLY)
#    Use --force only on a brand-new dev DB.
npm run db:push

# 4. Start dev server (Express + Vite middleware on port 5000)
npm run dev

# 5. Open http://localhost:5000
```

### Useful scripts
| Script | What it does |
|---|---|
| `npm run dev` | Start Express + Vite dev server (port 5000). Single port serves API and SPA. |
| `npm run dev:client` | Vite-only dev server (rare; used for client-only debugging). |
| `npm run build` | Bundles client (vite) and server (esbuild → `dist/index.cjs`). |
| `npm start` | Runs the production bundle (`node dist/index.cjs`). |
| `npm run check` | TypeScript check (no emit). |
| `npm run db:push` | Sync Drizzle schema to DB. **NEVER run against production.** |

### Logging in (after seeding)
Visit `/login`, use:
- Email: whatever `ADMIN_EMAIL` is set to (default fallback: `info@corefinancials.org`)
- Password: the value of `ADMIN_PASSWORD`

---

## 9. File / Folder Tree (current)

> Generated 21 April 2026. Excludes `node_modules/`, `.git/`, `dist/`, `attached_assets/`, `.local/`, `.cache/`, `.config/`, `.upm/`, `uploads/`, `.replit*`. See §10 for the full uploaded image list.

```
.
├── Advisory_Connect_NDA_System_Description.docx
├── PROJECT_HANDOFF.md           ← this file
├── CURRENT_STATE.md             ← what we're working on right now
├── SYSTEM_DESCRIPTION_NDA.md
├── replit.md                    ← Replit-loaded memory (legacy notes)
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vite-plugin-meta-images.ts
├── postcss.config.js
├── drizzle.config.ts
├── components.json              ← shadcn/ui config
├── .gitignore
│
├── shared/
│   └── schema.ts                ← Drizzle schema, zod schemas, grading, constants
│
├── server/
│   ├── index.ts                 ← Express bootstrap, sessions, vite middleware
│   ├── auth.ts                  ← requireAuth middleware + PUBLIC_API_ROUTES
│   ├── db.ts                    ← Drizzle client (DATABASE_URL)
│   ├── routes.ts                ← All REST endpoints (~894 lines)
│   ├── storage.ts               ← IStorage interface + Drizzle implementation
│   ├── sendgrid.ts              ← Email send helper
│   ├── static.ts                ← Production static-file serving
│   └── vite.ts                  ← Dev-mode Vite middleware
│
├── client/
│   ├── index.html               ← SPA shell + OG/Twitter meta tags
│   ├── public/
│   │   ├── advisory-connect-logo.png
│   │   ├── favicon.png
│   │   └── opengraph.jpg
│   └── src/
│       ├── main.tsx             ← React root
│       ├── App.tsx              ← Wouter router + auth gate
│       ├── index.css            ← Tailwind v4 entry + theme tokens
│       │
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── Dashboard.tsx           ← Stats / charts (dark glass)
│       │   ├── CIV.tsx                 ← Client Information Viewer
│       │   ├── ManageAdvisors.tsx      ← Master advisor table
│       │   ├── CreateAdvisor.tsx       ← New-advisor form
│       │   ├── EditAdvisor.tsx
│       │   ├── AdvisorPanel.tsx        ← Per-advisor mini panel (5072 lines!)
│       │   ├── AdvisorProfile.tsx      ← Public mobile contact card
│       │   ├── CallbackForm.tsx        ← Public call-back form
│       │   ├── ReferralForm.tsx        ← Public referral form
│       │   ├── WillForm.tsx            ← Public will-request form
│       │   ├── Login.tsx
│       │   └── not-found.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   └── AppLayout.tsx       ← Black sidebar shell
│       │   └── ui/                     ← shadcn/ui (56 primitives)
│       │
│       ├── hooks/
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       │
│       └── lib/
│           ├── queryClient.ts          ← Tanstack Query setup
│           ├── themeUtils.ts           ← 12 themes + helpers
│           └── utils.ts                ← cn() helper
│
└── script/
    └── build.ts                 ← Production build orchestrator (vite + esbuild)
```

### Codebase metrics (21 Apr 2026)
- **284** total commits over **21 active dev days**, spanning **25 Feb 2026 → 21 Apr 2026** (~8 weeks).
- **18,978** lines of TypeScript/TSX across **85** files.
- **13** pages, **56** UI primitives, **8** server files.
- Largest single file: `client/src/pages/AdvisorPanel.tsx` (**5,072 lines**) — top candidate for splitting.

---

## 10. Quick reference: routes

### Pages (frontend, wouter)
| Path | Page | Auth |
|---|---|---|
| `/login` | Login | public |
| `/` | HomePage | admin |
| `/stats` | Dashboard | admin |
| `/civ` | CIV | admin |
| `/manage` | ManageAdvisors | admin |
| `/create` | CreateAdvisor | admin |
| `/edit/:id` | EditAdvisor | admin |
| `/advisor/:slug` | AdvisorPanel (advisor mini panel) | advisor or admin |
| `/:slug` | AdvisorProfile (public card) | public |
| `/profile/:slug/request-callback` | CallbackForm | public |
| `/profile/:slug/referrals` | ReferralForm | public |
| `/profile/:slug/will` | WillForm | public |

### API (server)
**Public** (no auth required — see `server/auth.ts::PUBLIC_API_ROUTES`)
- `GET  /api/advisors/slug/:slug` — fetch one advisor by slug
- `POST /api/advisor-auth/login` — per-advisor login
- `POST /api/referral` — create referral lead
- `POST /api/callback` — create callback lead
- `POST /api/will-request` — create will request
- `POST /api/webhook/zoho` / `POST /api/webhook/inbound-email` — inbound email webhooks (stubs)
- `POST /api/stats/access` — record visit
- `POST /api/auth/login` / `GET /api/auth/session` / `POST /api/auth/logout`
- `POST /api/upload/profile-pic` — multer upload
- `GET  /api/og-image/:slug` — OG image for share previews
- `GET  /uploads/*` — static file serving

**Authenticated** (admin session OR matching advisor session)
- `GET  /api/advisors`
- `POST /api/advisors` / `PATCH /api/advisors/:id` / `DELETE /api/advisors/:id`
- `PATCH /api/advisors/:id/toggle`
- `POST /api/advisors/:id/profiles` / `PATCH /api/advisors/:id/profiles/:profileId`
- `GET  /api/emails`
- `POST /api/emails` / `DELETE /api/emails/:id`
- `PATCH /api/emails/:id/grade` / `PATCH /api/emails/:id/status` / `PATCH /api/emails/:id/open`
- `GET  /api/dashboard/stats` / `GET /api/dashboard/activity`

---

## 11. Glossary

- **CIV** — Client Information Viewer; the lead inbox visible to admin and advisor.
- **Mini panel** — The advisor-scoped control panel at `/advisor/:slug`.
- **Master panel** — The admin-scoped control panel (everything except `/advisor/:slug` and public pages).
- **Profile slug** — Unique URL fragment, e.g. `stewart-bailie`. Used for both the public card (`advisoryconnect.pro/[slug]`) and the mini panel (`app.advisoryconnect.pro/advisor/[slug]`).
- **Grade** — Auto-assigned tier on each lead: Gold / Silver / Bronze / Development.
- **Lead status** — Workflow state: Need to Contact → Contacted → Archive.
- **Inheritance** — Secondary profile fields default to the parent advisor's values when unset; intentional, not a bug.

---
*End of handoff. For "what we did most recently and what's next", see `CURRENT_STATE.md`.*
