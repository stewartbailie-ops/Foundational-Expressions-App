# Advisory Connect — System Technical Description
**Prepared for inclusion in a Non-Disclosure Agreement**
**Classification: Confidential**

---

## 1. Overview

Advisory Connect is a proprietary web-based software platform built for Core Financials. It consists of two distinct environments that work together:

1. **The Master Control Panel** — a password-protected internal administration interface used by authorised staff to manage financial advisors, monitor client leads, and view business statistics.
2. **Public Advisor Profiles** — individually branded, mobile-optimised web pages accessible to the public at `advisoryconnect.pro/[advisor-slug]`, through which prospective clients can view an advisor's services, request a callback, or submit a referral.

The platform is designed to standardise how Core Financials' network of advisors presents themselves digitally, while centralising lead capture, client grading, and activity tracking in one secure back-end system.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend (UI) | React 18, Vite, Tailwind CSS v4, shadcn/ui component library |
| Backend (API) | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (hosted on Replit's managed infrastructure) |
| ORM (database layer) | Drizzle ORM with Drizzle-Zod for validation |
| Session management | express-session with connect-pg-simple (sessions stored in PostgreSQL) |
| File uploads | Multer (profile picture uploads stored server-side) |
| Email delivery | SendGrid API |
| Bot protection | Google reCAPTCHA v2 (on public-facing forms) |
| QR code generation | qrcode.react (dynamic, rendered client-side) |
| Hosting | Replit cloud platform |

---

## 3. System Components

### 3.1 Master Control Panel

The control panel is accessible only to authorised administrators. It is a single-page web application rendered server-side via Vite and served by the Express backend. The following sections are available within the control panel:

**Home Dashboard**
Displays a welcome view with quick summary statistics: total client leads received, total referrals, total profile accesses, and active advisor count. Navigation cards provide quick access to all sections.

**Stats Tracker**
A real-time analytics view showing weekly activity charts pulled from the database. Tracks three event types: client leads received (`email_received`), referrals submitted (`referral_sent`), and public profile accesses (`app_access`).

**CIV — Client Information Viewer**
A searchable, filterable table of all client leads and referrals submitted through any advisor's public profile. Each lead is displayed with:
- Name, email, phone number, age, income range, industry
- Lifestyle indicators: married, children, owns a vehicle, owns property
- Services requested and preferred contact time
- Lead type (Call Back, Referral, Will Request)
- Automatically assigned grade (Gold, Silver, Bronze, Development)
- Lead status (Need to Contact / Contacted / Archive) — editable inline
- Referrer details (where applicable)

Administrators can manually override a client's auto-assigned grade at any time.

**Manage Advisors**
A list of all advisor accounts showing name, title, profile URL, and active/inactive status. Each entry includes buttons to edit, view the live profile, copy the profile link, and delete the advisor. A "New Advisor" button opens the creation form.

**Create / Edit Advisor**
A comprehensive form used to create a new advisor record or edit an existing one. Fields include:
- Full name, title (from a fixed list of four professional designations), and email address
- Contact number, location, and working hours
- Profile picture upload (with an integrated image cropper)
- Introduction/bio (choose from three pre-written professional options, or enter a custom bio)
- Selection of individual and corporate services to display on the profile
- Social media and website links (LinkedIn, Facebook, Instagram, YouTube, website)
- Theme selection (12 colour themes) and background pattern (6 options)
- Section visibility toggles for granular profile control
- Support for multiple sub-profiles per advisor (each with its own URL slug, nickname, and settings)

**Per-Advisor Mini Control Panel** (`/advisor/[slug]`)
Each advisor has their own password-protected control panel at a personal URL. This allows advisors to self-manage limited aspects of their profile without full admin access. The advisor authenticates via a two-step email OTP flow: they enter their registered email address, receive a six-digit one-time code by email (valid for 10 minutes), enter the code, and then proceed to set or enter their panel password.

---

### 3.2 Public Advisor Profiles

Each advisor is assigned a unique URL slug (e.g. `advisoryconnect.pro/john-smith`). Their public profile is a standalone mobile-optimised page (not behind any login) containing the following sections, each of which can be toggled on or off per advisor:

- **Header** — advisor's name, professional title, and SVG initials badge
- **Profile Photo** — full-width portrait photo (if uploaded)
- **Utility Buttons** — Share Profile (native mobile share or clipboard fallback), WhatsApp direct link, Save Business Card (generates a downloadable `.vcf` contact file), Add to Home Screen (PWA prompt)
- **Introduction** — professional bio paragraph
- **Individual Services** — expandable accordion of selected services with descriptions
- **Corporate Services** — expandable accordion of selected services with descriptions
- **Money Map** — button linking to a financial overview tool (in development)
- **Claim Your Free Will** — button linking to a will request form
- **Request a Call Back** — button leading to the callback form
- **Refer Friends & Family** — button leading to the referral form
- **Documents Upload** — placeholder for a future document portal
- **Social Links** — links to LinkedIn, Facebook, Instagram, YouTube, and website
- **General Financial Media** — expandable section with links to financial news, fun facts, and tutorial videos
- **Contact Details** — email, phone number, and working hours
- **QR Code** — dynamically generated QR code linking to the advisor's profile URL

**Language Switcher**
Every public profile includes a language toggle at the top, allowing visitors to switch all on-page text between English, Afrikaans, and Zulu. This covers all button labels, section headers, service names, service descriptions, and all three preset bio options.

**Background & Theming**
Each profile renders using one of 12 selectable colour themes (blue, dark, pink, light-blue, dark-royal-purple, green, gold, teal, red, navy, coral, silver), each with a full dark/light mode implementation. Six background pattern options are available per theme.

---

### 3.3 Public Forms

**Callback Request Form** (`/[slug]/request-callback`)
Collects the following from a prospective client:
- First name, surname, email address, phone number, age
- Income range (six bands)
- Situational indicators: married (yes/no), children (yes/no), vehicle (yes/no), property (yes/no)
- Preferred contact time, services of interest
- Age confirmation (must confirm over 18)
- Google reCAPTCHA v2 verification

On submission the data is stored as a lead in the database, auto-graded, and an email notification is sent to the advisor and to `info@corefinancials.org` via SendGrid.

**Referral Form** (`/[slug]/referrals`)
Collects the referrer's details (name, email, phone) plus details for up to 20 referred individuals, each with the same demographic fields as the callback form, plus the relationship to the referrer. Each referred individual is stored as a separate lead record. Google reCAPTCHA v2 is required before submission.

**Will Request Form** (`/[slug]/claim-will`)
Collects basic contact and demographic details from a client wishing to claim a complimentary will drafting service.

---

## 4. Data Model

The database contains four primary tables:

### `advisors`
Stores the complete profile of each financial advisor.

| Field | Type | Description |
|---|---|---|
| id | Integer (auto) | Primary key |
| name | Text | Full name |
| email | Text | Registered email (used for OTP login) |
| contactNumber | Text | Phone / WhatsApp number |
| location | Text | Office location |
| workingHours | Text | Displayed on profile |
| title | Text | Professional designation |
| bioOption | Text | Bio template key (a / b / c / custom) |
| customBio | Text | Custom bio text |
| entityType | Text | individual or corporate |
| theme | Text | Colour theme identifier |
| backgroundStyle | Integer | Background pattern (1–6) |
| profilePicUrl | Text | URL of uploaded profile photo |
| profileSlug | Text | Unique URL slug |
| individualServices | Text[] | Array of selected service keys |
| corporateServices | Text[] | Array of selected service keys |
| linkedinUrl, facebookUrl, instagramUrl, youtubeUrl, websiteUrl | Text | Social links |
| show* fields | Boolean | 14 section visibility toggles |
| advisorPasswordHash | Text | bcrypt hash of advisor panel password |
| advisorPasswordSet | Boolean | Whether password has been set |
| active | Boolean | Whether profile is publicly visible |
| createdAt | Timestamp | Record creation time |

### `advisor_profiles`
Stores alternate sub-profiles for a single advisor (e.g. a personal profile and a corporate-facing profile). Has the same content fields as `advisors` plus a `nickname` and `advisorId` foreign key. Each sub-profile has its own unique slug and independent section settings.

### `emails`
Stores every client lead (callback, referral, will request) received through the platform.

| Field | Type | Description |
|---|---|---|
| id | Integer (auto) | Primary key |
| advisorId | Integer | Foreign key to advisors |
| senderName / senderEmail | Text | Client contact details |
| type | Text | Call Back / Referral / Will Request |
| grade | Text | Auto-assigned: Gold / Silver / Bronze / Development |
| leadStatus | Text | Need to Contact / Contacted / Archive |
| clientAge, clientIncome, clientIndustry | Various | Demographic data |
| clientPhone | Text | Client phone number |
| clientMarried, clientChildren, clientVehicle, clientProperty | Boolean | Lifestyle indicators |
| preferredContactTime | Text | When client prefers to be contacted |
| servicesRequested | Text | Services the client is interested in |
| referrerName, referrerEmail, referrerPhone, referrerRelation | Text | Referrer details (where applicable) |
| source | Text | Form origin identifier |
| receivedAt | Timestamp | Submission timestamp |

### `stats`
A lightweight event log used to power the Stats Tracker dashboard.

| Field | Type | Description |
|---|---|---|
| id | Integer (auto) | Primary key |
| advisorId | Integer (nullable) | Which advisor the event relates to |
| eventType | Text | email_received / referral_sent / app_access |
| eventDate | Timestamp | When the event occurred |

### `session` (auto-managed)
A PostgreSQL-backed session store automatically managed by `connect-pg-simple`. Stores active user sessions for the master control panel.

---

## 5. Client Grading Algorithm

Every lead submitted through the platform is automatically assigned a grade based on the client's demographic data using the following logic (applied in order):

| Condition | Grade |
|---|---|
| Age 60 or older | Development |
| Age 35–55, income R100,000+/month | Gold |
| Age 35+, income R100,000+/month | Gold |
| Industry is IT | Gold |
| Age 27–35, income R65,000+/month | Silver |
| Age 18–27, income R25,000 or below | Bronze |
| Income R100,000+/month (any age) | Gold |
| Income R65,000+/month (any age) | Silver |
| Income above R0 but R25,000 or below | Bronze |
| Default | Silver |

Administrators may override the auto-assigned grade at any time within the CIV.

---

## 6. Access Controls

### Master Control Panel
- Protected by a single shared administrator password stored as an encrypted environment secret (`ADMIN_PASSWORD`).
- Sessions are stored in PostgreSQL and last 7 days.
- All API routes that expose internal data (advisor lists, lead data, statistics) require an active authenticated session.
- Login endpoint: `POST /api/auth/login`. Session check: `GET /api/auth/session`. Logout: `POST /api/auth/logout`.

### Per-Advisor Panel
- Each advisor accesses their personal panel via a two-step process:
  1. Enter their registered email address — the system verifies it matches the email on file.
  2. A six-digit one-time code is sent to that email via SendGrid, valid for 10 minutes.
  3. On successful code entry, the advisor proceeds to set or enter their panel password.
- Passwords are hashed using bcrypt (industry-standard) before storage. The plain-text password is never stored.
- Sessions are scoped per-advisor using a unique session key (`advisor_[slug]`).

### Public Profile Pages and Forms
- No authentication is required to view a public advisor profile.
- All public-facing forms (callback, referral, will request) are protected by Google reCAPTCHA v2 to prevent automated bot submissions.
- Form submissions are validated server-side before being stored.

---

## 7. Third-Party Integrations

| Service | Purpose | Credential |
|---|---|---|
| **SendGrid** | Transactional email delivery — notifies `info@corefinancials.org` and the relevant advisor on each new lead, and sends OTP codes for advisor login | `SENDGRID_API_KEY` (stored as encrypted secret) |
| **Google reCAPTCHA v2** | Bot protection on all public-facing submission forms | `VITE_RECAPTCHA_SITE_KEY` (public) + `RECAPTCHA_SECRET_KEY` (encrypted secret) |
| **Replit** | Cloud hosting, managed PostgreSQL database, secret management, deployment infrastructure | Platform-level |

No payment processors, no third-party analytics scripts, and no data is shared with any other external service.

---

## 8. Email Notifications

All outbound emails are sent from `info@corefinancials.org` via SendGrid. The following events trigger an email:

- **New callback request** — sent to the advisor's registered email and to `info@corefinancials.org`, containing the client's full demographic details and requested services.
- **New referral submission** — one email per referred individual, sent to the same recipients, including referrer details and the referred client's profile.
- **New will request** — sent to the same recipients with the client's contact information.
- **Advisor OTP login code** — sent only to the advisor's registered email, containing their six-digit one-time access code.

---

## 9. Confidential Elements

The following elements of the system constitute proprietary intellectual property:

- The client grading algorithm (`autoGradeClient`) and its weighting logic
- The structure and content of the three pre-written professional bio templates
- The service catalogue (individual and corporate) and associated descriptions in English, Afrikaans, and Zulu
- The per-advisor multi-profile architecture and its URL slug system
- The design system, colour themes, background patterns, and SVG initials badge generation
- The end-to-end OTP authentication flow for per-advisor panel access
- All source code, database schema, and configuration

---

*This document is intended to provide a plain-English technical summary of the Advisory Connect platform for the purpose of defining the scope of confidential information covered by the associated Non-Disclosure Agreement. It does not constitute complete technical documentation and is not intended for use as a deployment or development guide.*
