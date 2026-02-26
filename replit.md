# Advisor Connect Control Panel

## Overview
A master control panel / dashboard for managing Advisor Connect profiles. Desktop-optimized, corporate black-and-white theme.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Email Service**: SendGrid (API key stored as secret `SENDGRID_API_KEY`)
- **QR Codes**: `qrcode.react` for dynamic barcode generation

## Database Tables
- `advisors` - Advisor profiles (name, email, bio, entityType, themeColor, font, profileSlug, active, etc.)
- `emails` - Incoming emails linked to advisors (senderName, senderEmail, type, grade, subject, body)
- `stats` - Event tracking (email_received, referral_sent, app_access)

## Key Features
1. **Stat's Tracker (Dashboard)** - Real-time stats from database (emails, accesses, referrals, active advisors) with weekly activity chart
2. **CIV (Client Information Viewer)** - Email table with search, grade filter, and inline grade editing
3. **Manage Advisors** - List all advisors with active/inactive toggle switches
4. **Create New Advisor** - Step-by-step form with live QR code generation based on profile slug

## API Routes
- `GET /api/dashboard/stats` - Dashboard summary counts
- `GET /api/dashboard/activity` - Weekly activity data for chart
- `GET /api/advisors` - List all advisors
- `POST /api/advisors` - Create advisor
- `PATCH /api/advisors/:id` - Update advisor
- `PATCH /api/advisors/:id/toggle` - Toggle active/inactive
- `GET /api/emails` - List all emails with advisor names
- `POST /api/emails` - Create email record
- `PATCH /api/emails/:id/grade` - Update email grade
- `POST /api/webhook/inbound-email` - SendGrid Inbound Parse webhook
- `POST /api/stats/access` - Record app access event

## Email Integration Notes
- SendGrid is configured for sending emails via `@sendgrid/mail`
- Inbound email webhook at `/api/webhook/inbound-email` is ready for SendGrid Inbound Parse
- To receive emails: Configure SendGrid Inbound Parse to POST to this app's `/api/webhook/inbound-email` endpoint
- The AgentMail integration was dismissed; using SendGrid API key directly instead

## File Structure
- `shared/schema.ts` - Drizzle schema definitions
- `server/db.ts` - Database connection
- `server/storage.ts` - Storage interface with all CRUD operations
- `server/routes.ts` - Express API routes
- `server/sendgrid.ts` - SendGrid email utility
- `client/src/pages/` - Dashboard, CIV, ManageAdvisors, CreateAdvisor
- `client/src/components/layout/AppLayout.tsx` - Sidebar navigation layout
