# Advisory Connect Control Panel

## Overview
A master control panel / dashboard for managing Advisory Connect profiles. Desktop-optimized, corporate black-and-white theme.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Email Service**: SendGrid (API key stored as secret `SENDGRID_API_KEY`)
- **QR Codes**: `qrcode.react` for dynamic barcode generation

## Database Tables
- `advisors` - Advisor profiles (name, email, bio, entityType, themeColor, font, profileSlug, active, etc.)
- `emails` - Incoming client submissions linked to advisors (senderName, senderEmail, type, grade, subject, body, clientAge, clientIncome, clientIndustry, clientPhone, source)
- `stats` - Event tracking (email_received, referral_sent, app_access)

## CIV Grading System
Clients are auto-graded based on demographics:
- **Gold**: Age 35-55+, R100k+ income, IT industry
- **Silver**: Age 27-35, R65k+ income
- **Bronze**: Age 18-27, R25k & below
- **Development/Other**: Age 60+, call-back requests
Grades can be manually overridden via dropdown in CIV.

## Key Features
1. **Home** - Logo, welcome message, quick stats summary, navigation cards
2. **Stat's Tracker (Dashboard)** - Real-time stats from database with weekly activity chart
3. **CIV (Client Information Viewer)** - Client table with grade cards (Gold/Silver/Bronze/Development), search, filter, expandable detail rows, inline grade override
4. **Manage Advisors** - List all advisors with active/inactive toggle switches
5. **Create New Advisor** - Step-by-step form with live QR code generation based on profile slug

## API Routes
- `GET /api/dashboard/stats` - Dashboard summary counts
- `GET /api/dashboard/activity` - Weekly activity data for chart
- `GET /api/advisors` - List all advisors
- `GET /api/advisors/slug/:slug` - Lookup advisor by profile slug
- `POST /api/advisors` - Create advisor
- `PATCH /api/advisors/:id` - Update advisor
- `PATCH /api/advisors/:id/toggle` - Toggle active/inactive
- `GET /api/emails` - List all emails with advisor names and full client details
- `POST /api/emails` - Create email record (auto-grades client)
- `PATCH /api/emails/:id/grade` - Update email grade (Gold/Silver/Bronze/Development)
- `POST /api/referral` - Referral API (accepts all Advisor Connect template fields + referrer info)
- `POST /api/callback` - Callback request API (accepts all template fields)
- `POST /api/webhook/zoho` - Zoho Mail webhook endpoint
- `POST /api/webhook/inbound-email` - SendGrid Inbound Parse webhook
- `POST /api/stats/access` - Record app access event

## Client Data Fields (from Advisor Connect template)
Core: name, email, phone, age, income range, industry
Profile: married, children, vehicle, property
Contact: preferred contact time, services requested
Referrer: referrer name, email, phone, relationship

## Integration Architecture
- Each advisor gets a cloned Advisor Connect app (template: @stewartbailie/Advisor-Connect-Chris-Zeeman)
- Advisor Connect apps use Zoho Mail for email
- Zoho forwards email data to this control panel via `/api/webhook/zoho`
- Advisor Connect apps POST form submissions directly to `/api/referral` and `/api/callback`
- No built-in Zoho integration on Replit — Zoho Flow or forwarding rules push data to webhook URL

## Email/Referral Integration Notes
- SendGrid configured for sending outbound emails via `@sendgrid/mail`
- Zoho webhook at `/api/webhook/zoho` for inbound email processing
- SendGrid webhook at `/api/webhook/inbound-email` as fallback
- The AgentMail integration was dismissed

## File Structure
- `shared/schema.ts` - Drizzle schema + autoGradeClient() logic
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all CRUD operations
- `server/routes.ts` - Express API routes
- `server/sendgrid.ts` - SendGrid email utility
- `client/src/pages/` - HomePage, Dashboard, CIV, ManageAdvisors, CreateAdvisor
- `client/src/components/layout/AppLayout.tsx` - Sidebar navigation layout with logo