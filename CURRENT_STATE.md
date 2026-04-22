# Current State — Advisory Connect

> **Last updated:** 21 April 2026
> **Latest commit:** `80ffc402` (Published your App)
> **Total commits:** 284
> **Status:** Live in production on `advisoryconnect.pro` + `app.advisoryconnect.pro`. Healthy. No known production bugs.

Read `PROJECT_HANDOFF.md` first for the big picture. This file is *only* "where we left off and what's next."

---

## 1. What was most recently worked on

In rough chronological order from this session (newest at top):

### ✅ Just completed
1. **Seeded 23 more test leads** (IDs 95–117) into Stewart Bailie's CIV (advisor ID 24) via the public APIs:
   - 8 Referrals (POST `/api/referral`)
   - 8 Call Backs (POST `/api/callback`)
   - 7 Will Requests (POST `/api/will-request`)
   - Total test leads on advisor ID 24 now: **48** (IDs 70–117).

2. **Seeded the first 25 test leads** (IDs 70–94) for the same advisor — same balanced spread (9 + 8 + 8).

3. **Fixed a real production bug**: `/api/will-request` was missing from the `PUBLIC_API_ROUTES` whitelist in `server/auth.ts`, so any client filling in the public will form was blocked with 401. Added the route → published → confirmed all 8 wills landed.

4. **Re-aligned Primary / Secondary badge** on the AdvisorPanel mini-card. Was clipping off the right edge on narrow phone screens because it lived inside a `[1fr_auto]` grid that overflowed. Pulled it out into an `absolute top-2 right-2` corner pin with a small top-padding bump on the parent card. File: `client/src/pages/AdvisorPanel.tsx`.

5. **Fixed invisible "Panel" button** in the master Manage Advisors table. The `LayoutDashboard` icon had hard-coded `text-white/80`, which disappears on the table's light surface. Removed the white-only classes so it inherits the same default ghost-button colour as Edit / Profile / Copy / Delete next to it. File: `client/src/pages/ManageAdvisors.tsx`.

6. **Linked the second custom domain** `app.advisoryconnect.pro` to the deployment. Both `advisoryconnect.pro` (apex → public profiles) and `app.advisoryconnect.pro` (subdomain → admin) are now verified, HTTPS-issued, and serving the same app/database.

7. **Rotated admin login credentials** without code changes:
   - Made the admin email configurable via `ADMIN_EMAIL` env var (server/routes.ts ~line 85; falls back to legacy default).
   - Set `ADMIN_EMAIL=info@advisoryconnect.pro`.
   - User updated `ADMIN_PASSWORD` secret via the secure prompt (different from anything pasted in chat).
   - Restarted the workflow; login confirmed working.

8. **Added the "Elevate your professional presence — www.advisoryconnect.pro" footer** to every public contact card (`client/src/pages/AdvisorProfile.tsx` ~lines 1789–1806). Centred under the QR / Powered-by line. Link uses each card's theme accent colour. Initial deploy had a `themeAccent` ReferenceError that broke the cards — fixed immediately by switching to the in-scope `tc.accentColor`.

### ✅ Earlier in the session (still relevant context)
- **ProfileCard contrast pass** — card now uses theme gradient via `getInitialsBadgeColors()` with drop-shadow; inner Copy/Share & View Profile buttons converted to solid white with theme-accent bold text (guaranteed contrast across all 12 themes); admin notes overlay strengthened to 55% black.
- **Dashboard.tsx** rewritten using a new `StatTile` component — dark glass (`rgba(255,255,255,0.06)` + white border + white text); chart axes/bars/tooltip recoloured for dark backgrounds.
- **ManageAdvisors** — "Subscription Service" tile + search input converted to dark glass with white text and 40% white placeholder.
- **CIV** — search input dark-glassed; Referrals / Call Backs filter pills now dark-glass when inactive, solid white when active.
- **First production seed** (15 leads, IDs 35–49) for the *original* Stewart Bailie advisor (ID 17, slug `stewart-douglas-bailie`). Then 20 more (IDs 50–69) the next round.

---

## 2. Incomplete or half-finished work

| Item | Status | Notes |
|---|---|---|
| **Wipe of test leads on advisor ID 17** (IDs 35–69, 35 entries) | User opted to delete them manually via the CIV UI. Some/all may still be in production. | Not blocking; user-controlled. |
| **Wipe of test leads on advisor ID 24** (IDs 70–117, 48 entries) | Awaiting CIV upgrades — these will be wiped manually after testing is complete. | Not blocking. |
| **`themeUtils.ts` fallback colour** (lines ~319–327) | Still hard-coded to legacy blue `#4a8db5`. | Should be neutral grey/black. Tracked since previous session. |
| **Authz middleware on advisor CRUD** | Deferred. Currently only the global admin session gates these endpoints; per-advisor scoping not enforced. | Acceptable for single-operator launch; revisit before multi-tenant scale. |
| **Full 12-theme contrast audit** | Partially done. ProfileCard, Dashboard, ManageAdvisors, CIV completed. Remaining surfaces (CreateAdvisor wizard, EditAdvisor, advisor mini-panel inner tabs) not yet swept. | Pick up incrementally as bugs surface. |
| **Secondary profile "View Profile" UX confusion** | Investigation paused. Awaiting user confirmation on whether the URL bar / page title actually differ between primary and secondary profile preview. | Likely a perception issue (inheritance making them look identical), not a real bug. |
| **`AdvisorPanel.tsx` size** (5,072 lines) | No refactor underway. | Top candidate for componentisation; safe to do incrementally because each section is a self-contained component within the file. |

---

## 3. What the next planned steps were

The user's next focus is **CIV upgrades / developments** — they intentionally seeded the 48 test leads to have realistic data to design against.

### Immediate next session
1. **Define the CIV upgrade scope with the user.** Likely candidates (not yet confirmed):
   - Bulk actions (multi-select → bulk grade / status / delete).
   - Saved filters / quick-views.
   - Sort by recency, grade, lead-status, alphabetical.
   - Inline notes on each lead.
   - Export to CSV.
   - Date-range filter.
   - Lead lifecycle history (audit log of grade changes / status moves).
2. **Listen for the user's specific list** before building anything — they have a clear vision.

### Small follow-ups also queued
- Replace `#4a8db5` fallback in `themeUtils.ts` with a neutral colour.
- Decide whether to add a small visual "inherits from primary" hint on secondary profiles to reduce confusion.
- Eventually break `AdvisorPanel.tsx` into per-tab files (`AdvisorPanel/ProfileTab.tsx`, `AdvisorPanel/CivTab.tsx`, etc.) — only when touching it for an upgrade, not as a standalone refactor.

---

## 4. Saved state confirmation

- ✅ All edits committed via Replit auto-checkpoints; latest commit `80ffc402` ("Published your App"). Working tree at HEAD.
- ✅ All test leads exist in **production** PostgreSQL only. No data lives in chat history that isn't also in the DB.
- ✅ Admin credentials live only in Replit Secrets (`ADMIN_EMAIL` env var, `ADMIN_PASSWORD` secret). Nothing is in code.
- ✅ Custom domains verified and serving traffic.
- ✅ `PROJECT_HANDOFF.md` written alongside this file — both are committed in this same change.

---

## 5. Quick orientation for a new assistant

If you are a fresh AI agent picking this up cold:

1. **Read `PROJECT_HANDOFF.md` end to end first.** It is the source of truth.
2. **Then re-read this file** for the immediate context.
3. **Do not run `npm run db:push` against production.** Schema changes are applied via manual `ALTER TABLE` to avoid destructive ops. The dev DB can be safely reset.
4. **Production database is read-only via the agent's `executeSql` tool** when `environment: "production"`. To mutate production data, call the deployed REST endpoints. To delete admin-protected resources from a fresh session, ask the user to paste a `fetch(...)` snippet into their already-logged-in browser's DevTools console — the user has done this pattern before and is comfortable with it.
5. **Stewart Bailie has two production advisor records**: the legacy one at ID 17 (slug `stewart-douglas-bailie`) and the fresh one at ID 24 (slug `stewart-bailie`). Test leads were seeded against both; the active testing target is **ID 24**.
6. **The user is non-technical-friendly but technically literate.** They appreciate plain-English summaries plus a short technical detail when relevant. They explicitly thanked the agent for security suggestions (e.g. "don't paste passwords in chat") — keep those instincts.
7. **Asked-for behaviour**: do the work, report concisely, suggest small follow-ups but don't sprawl. Avoid emojis unless the user uses them first; the user does occasionally so light celebratory emojis (🚀 🎉 🥂) are welcome on milestones.

---

*End of state file.*
