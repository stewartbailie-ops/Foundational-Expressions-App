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
- `POST /api/advisors` - Create advisor
- `PATCH /api/advisors/:id` - Update advisor
- `PATCH /api/advisors/:id/toggle` - Toggle active/inactive
- `GET /api/emails` - List all emails with advisor names and client details
- `POST /api/emails` - Create email record (auto-grades client)
- `PATCH /api/emails/:id/grade` - Update email grade (Gold/Silver/Bronze/Development)
- `POST /api/referral` - Direct referral API (advisor apps post client details here for auto-grading)
- `POST /api/webhook/inbound-email` - SendGrid Inbound Parse webhook
- `POST /api/stats/access` - Record app access event

## Email/Referral Integration Notes
- SendGrid is configured for sending emails via `@sendgrid/mail`
- Inbound email webhook at `/api/webhook/inbound-email` ready for SendGrid Inbound Parse
- Direct referral API at `/api/referral` for advisor apps to submit structured client data with auto-grading
- The AgentMail integration was dismissed; using SendGrid API key directly instead

## File Structure
- `shared/schema.ts` - Drizzle schema + autoGradeClient() logic
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all CRUD operations
- `server/routes.ts` - Express API routes
- `server/sendgrid.ts` - SendGrid email utility
- `client/src/pages/` - HomePage, Dashboard, CIV, ManageAdvisors, CreateAdvisor
- `client/src/components/layout/AppLayout.tsx` - Sidebar navigation layout with logo