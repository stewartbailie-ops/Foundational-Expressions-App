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
- `emails` - Incoming client submissions (senderName, senderEmail, type, grade, subject, body, clientAge, clientIncome, clientIndustry, clientPhone, clientMarried, clientChildren, clientVehicle, clientProperty, preferredContactTime, servicesRequested, referrerName, referrerEmail, referrerPhone, referrerRelation, source)
- `stats` - Event tracking (email_received, referral_sent, app_access)

## Advisor Profile Fields
- **Title**: Executive Financial Planner / Financial Planner / Executive Financial Advisor / Financial Advisor
- **Bio Options**: a (core focus), b (integrated strategic), c (clarity & structure), or custom
- **Individual Services**: 7 services (tax-efficiency, tax-investment, personal-risk, retirement, medical-aid, short-term, wills-estates)
- **Corporate Services**: 5 services (corporate-planning, group-risk, pension-provident, group-medical, corporate-short-term)
- **Theme**: dark (black/white), blue, or pink
- **Profile Picture**: Uploaded via multer to `/uploads/` directory, URL stored as `profilePicUrl`
- Services stored as key arrays, displayed by name via constants in schema.ts

## CIV Grading System
Clients are auto-graded based on demographics:
- **Gold**: Age 35-55+, R100k+ income, IT industry
- **Silver**: Age 27-35, R65k+ income
- **Bronze**: Age 18-27, R25k & below
- **Development/Other**: Age 60+, call-back requests

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