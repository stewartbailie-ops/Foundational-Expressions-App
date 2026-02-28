# Advisory Connect Control Panel

## Overview
A master control panel / dashboard for managing Advisory Connect profiles, tracking client referrals/callbacks, and auto-grading clients. Desktop-optimized, corporate black-and-white theme. Each advisor gets a public-facing mobile-optimized profile page.

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
- `advisors` - Advisor profiles (name, email, title, bio, bioOption, customBio, entityType, theme, themeColor, font, profilePicUrl, coverImageUrl, linkedinUrl, websiteUrl, profileSlug, individualServices[], corporateServices[], active, createdAt)
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
4. **Manage Advisors** - List advisors with active/inactive toggles, "New Advisor" button
5. **Create New Advisor** - Full form with header, profile pic, bio options, services checkboxes, theme selection, QR code preview
6. **Public Profile Page** (`/profile/:slug`) - Mobile-optimized, dark/pink themed, expandable services, callback/referral buttons, QR code
7. **Callback Form** (`/profile/:slug/request-callback`) - Client details form with income, situation toggles, service selection
8. **Referral Form** (`/profile/:slug/referrals`) - Referrer details + up to 4 referral entries

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