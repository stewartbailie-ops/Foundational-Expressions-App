# Advisory Connect — System Technical Description
**Prepared for inclusion in a Non-Disclosure Agreement**
**Classification: Confidential**
**Last updated: 2 June 2026**

---

## 1. Overview

Advisory Connect is a proprietary web-based software platform built for Core Financials. It is delivered as a desktop-optimised internal control panel paired with mobile-optimised, individually branded public pages, and is also installable as an Android application (a Trusted Web Activity wrapping the same platform). It consists of the following environments that work together:

1. **The Master Control Panel** — a password-protected internal administration interface used by authorised staff to manage financial advisors, monitor and grade client leads, view business statistics, and administer the encrypted client vault.
2. **Per-Advisor Sub-Panels** — each advisor has their own password-protected panel to self-manage their profile(s), leads, share assets, billing, and client records.
3. **Public Advisor Profiles** — individually branded, mobile-optimised web pages accessible to the public at `advisoryconnect.pro/[advisor-slug]`, through which prospective clients can view an advisor's services, request a callback, submit a referral, or request a complimentary will.
4. **Book of Life** — an advisor-managed emergency profile for each client, viewable by first responders through an unguessable private link (described in full in Section 4).

The platform standardises how Core Financials' network of advisors presents itself digitally, centralises lead capture, client grading, and activity tracking, and operates a subscription billing model with a tiered feature set. It is engineered for South African compliance (POPIA) with at-rest encryption of sensitive personal information.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend (UI) | React 18, Vite, Tailwind CSS v4, shadcn/ui component library |
| Backend (API) | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (hosted on Replit's managed infrastructure) |
| ORM (database layer) | Drizzle ORM with Drizzle-Zod for validation |
| Session management | express-session with PostgreSQL-backed session storage |
| File storage | Replit Object Storage — public bucket (profile images) and private bucket (encrypted client documents) |
| Encryption | AES-256-GCM for "special personal information" at rest |
| Email delivery | SendGrid API |
| Payments / Subscriptions | Paystack (ZAR-native recurring billing) |
| Bot protection | Google reCAPTCHA v2 (advisory signal on public forms) |
| QR code generation | qrcode.react (dynamic, rendered client-side) |
| Hosting | Replit cloud platform — Reserved VM deployment (single warm instance) |
| Mobile distribution | Trusted Web Activity (Android), verified via Digital Asset Links |

---

## 3. System Components

### 3.1 Master Control Panel

The control panel is accessible only to authorised administrators. The following sections are available:

**Home Dashboard** — summary statistics and quick navigation to all sections.

**Stats Tracker** — analytics view showing weekly activity charts. Tracks profile-attributed events including client leads received, referrals submitted, and public profile accesses (with primary/secondary profile attribution).

**CIV — Client Information Viewer** — a searchable, filterable table of all leads and referrals submitted through any advisor's public profile, each with full demographic data, lifestyle indicators, services requested, lead type, and an automatically assigned score, grade, and lead temperature (see Section 5). Lead status is editable inline and administrators may override the auto-assigned grade. CSV export is available and admin-protected.

**Manage Advisors** — list of all advisor accounts with edit, view, copy-link, and delete actions, plus advisor creation.

**Create / Edit Advisor** — a comprehensive form to create or edit an advisor record, including identity and contact fields, profile picture upload, bio (preset or custom), individual/corporate service selection, social and website links, theme and background selection (12 colour themes plus CSS-generated and premium image background patterns), granular section visibility toggles, subscription state, and support for a secondary sub-profile.

**My Clients (Encrypted Client Vault)** — administration of POPIA-protected client records whose sensitive identifiers are stored encrypted (see Section 6).

**Audit Log** — admin-readable, append-only record of every access to protected personal information.

### 3.2 Per-Advisor Sub-Panel (`/advisor/[slug]`)

Each advisor has a password-protected panel at a personal URL to self-manage their profile(s), leads, share assets (QR code, share link, digital business card), subscription/billing, their encrypted client records, and their clients' Book of Life entries. Advisors authenticate via a two-step email one-time-passcode (OTP) flow before setting or entering a panel password.

### 3.3 Public Advisor Profiles

Each advisor is assigned a unique URL slug. Their public profile is a standalone, mobile-optimised page (not behind any login) composed of individually toggleable sections, including: header and initials badge, profile photo, utility buttons (share, WhatsApp, save contact card, add to home screen), introduction, individual and corporate services, callback / referral / will-request calls to action, social links, financial media, contact details, and a dynamically generated QR code.

**Public Profile Feature Suite** — five additional toggleable sections per profile: a TradingView market embed (multiple instruments), Daily Quotes (rotating), a Compound Interest calculator, a Retirement calculator, and a South African Financial Calendar. Section order is advisor-configurable.

**Financial Tools** — a suite of individually toggleable on-profile calculators (SA Tax, Exchange Rate with a ZAR rate table, Compound Interest, Vehicle Finance, Bond, Emergency Fund, Life Cover, Debt Payoff).

**Language Switcher** — toggles all on-page text between English, Afrikaans, and Zulu.

**Theming** — 12 selectable colour themes, each with CSS-generated background patterns and a set of premium image background patterns with an adjustable intensity control. A premium tier may remove footer branding (white-label).

**Per-Advisor Secondary Profiles** — each advisor may operate an independent secondary profile with its own slug, theme, tools, and services.

### 3.4 Public Forms

- **Callback Request Form** — collects contact and demographic details, income band, lifestyle indicators, preferred contact time, and services of interest; auto-graded on submission with email notification to the advisor and Core Financials.
- **Referral Form** — collects the referrer's details plus multiple referred individuals, each stored as a separate graded lead.
- **Will Request Form** — collects contact and demographic details for the complimentary will-drafting service.

All public forms include a POPIA privacy notice and are validated server-side. Submission endpoints are rate-limited.

### 3.5 Digital Business Card

A canvas-rendered shareable image card (portrait and square formats) generated client-side, distributed via the native share sheet with a download fallback, baking the platform privacy-policy URL into the footer.

---

## 4. Book of Life — Emergency Profile (Proprietary)

Book of Life is a standalone, advisor-managed emergency profile maintained for each client. It is designed so that, in a medical emergency, first responders and medical personnel can access a client's critical health, contact, and end-of-life information instantly via a private link — without any login.

**Purpose and value.** Book of Life turns the advisor relationship into a tangible, life-relevant service: a single trusted record of the information that matters most when a person cannot speak for themselves. It is positioned as a differentiated product capability in its own right.

**Information captured** (each field optional, advisor-maintained):
- Identity label for the client
- Critical medical data: blood type, allergies, chronic medications, medical conditions
- Two emergency contacts (name, relationship, phone) and a next-of-kin contact
- Medical aid details: scheme, membership number, plan, emergency line
- Treating GP (name, phone) and hospital preference
- Life insurance details: insurer, policy number, claims line
- Will status and attorney
- Paramedic notes and private advisor notes

**Access model.**
- Each Book of Life record is identified by a cryptographically random, unguessable token that forms its private URL (`/bol/[token]`).
- The **public emergency view is intentionally unauthenticated** so that a paramedic or hospital can open it immediately from the client's card or device — but it is reachable only by possession of the unguessable token, is rate-limited, and **exposes only the emergency-relevant subset of fields** (medical data, emergency contacts, medical aid, GP, hospital preference, paramedic notes). Private advisor notes, life-insurance, will, and next-of-kin administrative fields are **not** included in the public emergency response.
- Creation and editing are restricted to the owning advisor (or an administrator), enforced server-side: every create, find, and update operation is scoped to the authenticated advisor's identity.
- Records are decoupled from the formal client vault, so an advisor can prepare a Book of Life for any individual without first creating a full client record.

Book of Life, including its data model, field selection, public/private field partitioning, token-based access scheme, and its positioning as a discrete product, is proprietary and confidential.

---

## 5. Client Grading Algorithm (Grader 2.0)

Every lead is automatically assigned a score out of 100, a grade, and a temperature, using a weighted model:

- **Income (0–35)** — banded by monthly income, highest bands scoring highest.
- **Age (0–20)** — peak scoring for prime advisory age ranges, tapering for younger and older brackets.
- **Lifestyle (0–20)** — points for marriage, children, vehicle ownership, and property ownership.
- **Services (0–15)** — points per service of interest (capped), with a bonus for estate/will/retirement intent.
- **Source (0–10)** — weighted by lead origin (callback highest, then will, then referral).

**Grade** is derived from the total (Gold / Silver / Bronze / Development). **Temperature** (Hot / Warm / Cold) is derived from the lead source and richness of the supplied data. Administrators may override the grade at any time. The scoring weights, banding thresholds, and the full breakdown logic are proprietary.

---

## 6. Data Protection — POPIA / PII Encryption

The platform implements at-rest encryption and an audit trail for "special personal information" as contemplated by POPIA.

- Sensitive client identifiers (e.g. ID number, bank account and branch, tax number) are stored **only as ciphertext** using AES-256-GCM. The encryption key is held as an environment secret and never stored in the database or logs. A round-trip self-test runs at start-up so a misconfigured key prevents the system from booting.
- Client documents are stored **encrypted in private object storage**, with only metadata held in the database.
- An **append-only audit log** records who accessed or changed protected information, when, and from where. It cannot be edited or deleted in normal operation.
- **Consent** is recorded per grant, capturing the exact text agreed to.
- **Right to erasure** is supported: an administrator can wipe a client's encrypted fields and unlink documents while retaining an anonymised audit history.
- **Per-advisor isolation is enforced at the data-access layer**, not merely in the user interface, so one advisor cannot read another advisor's clients even if a route check were missed.
- Public submission and lookup endpoints are **rate-limited**, with blocked requests recorded in the audit log.

A documented key-management runbook governs key generation, sealed-envelope backup, recovery testing, rotation, and breach response.

---

## 7. Subscriptions and Billing

Recurring subscription billing is provided through Paystack (a South African-native, ZAR-first processor), with a free trial period and two paid tiers:

- **Basic** — a single public profile, the lead forms and grader, the registry with grade and temperature, all themes and patterns, QR / share link, daily quotes, a single-instrument market embed, basic analytics, and the digital business card.
- **Premium** — adds the secondary profile, the full grader breakdown and advanced analytics, premium image patterns, additional editorial and calculator features, the financial calendar and fund tools, multi-instrument market embeds, multi-format business cards with optional white-label footer removal, the encrypted client vault (My Clients), and priority support.

The advisor's subscription tier and status are the system's source of truth for feature gating and are updated by verified payment webhooks. Webhook calls are authenticated by cryptographic signature and processed idempotently. Tier-gating logic is enforced on both server and client.

---

## 8. Access Controls

**Master Control Panel** — protected by an administrator password held as an encrypted environment secret; sessions are stored in PostgreSQL and last seven days; internal data APIs require an active authenticated session.

**Per-Advisor Panel** — two-step access: the advisor enters their registered email, receives a six-digit OTP by email (time-limited), then sets or enters their panel password. Passwords are hashed (bcrypt) before storage; the plain-text password is never stored. Sessions are scoped per advisor.

**Public Profiles, Forms, and Book of Life public view** — no authentication required to view; protected by server-side validation, rate limiting, and (for Book of Life) an unguessable token plus restricted field exposure. reCAPTCHA is applied to public forms as an advisory signal.

**Webhooks** — payment webhooks are verified by cryptographic signature before any record is modified.

---

## 9. Third-Party Integrations

| Service | Purpose | Credential handling |
|---|---|---|
| **SendGrid** | Transactional email — lead notifications, advisor OTP codes, trial-expiry reminders | Encrypted secret |
| **Paystack** | ZAR recurring subscription billing and signed payment webhooks | Encrypted secrets |
| **Google reCAPTCHA v2** | Advisory bot signal on public forms | Public site key + encrypted secret |
| **Replit** | Cloud hosting, managed PostgreSQL, object storage, secret management, deployment | Platform-level |
| **Google Play (Digital Asset Links)** | Android app ownership verification for the Trusted Web Activity | Public verification file |

No third-party analytics scripts are loaded, and personal data is not shared with any external service beyond those listed above for their stated function.

---

## 10. Email Notifications

Outbound email is sent via SendGrid. Triggering events include: new callback request, new referral submission (one per referred individual), new will request, advisor OTP login codes, and trial-expiry reminders. Lead notifications are sent to the relevant advisor and to Core Financials.

---

## 11. Confidential Elements

The following constitute proprietary intellectual property covered by this agreement:

- The **Book of Life** feature in its entirety — data model, field set, public/private field partitioning, token-based access scheme, and product positioning.
- The client grading algorithm (Grader 2.0) — its scoring weights, banding thresholds, temperature logic, and breakdown.
- The POPIA encryption architecture, audit model, per-advisor data isolation scheme, and key-management runbook.
- The subscription tier design, feature-gating logic, and billing/webhook handling.
- The per-advisor multi-profile architecture and URL slug system.
- The structure and content of the preset professional bio templates.
- The service catalogue and associated descriptions in English, Afrikaans, and Zulu.
- The design system, colour themes, background patterns (including premium image patterns), digital business card rendering, and SVG initials badge generation.
- The end-to-end OTP authentication flow for advisor panel access.
- All source code, database schema, and configuration.

---

*This document provides a plain-English technical summary of the Advisory Connect platform for the purpose of defining the scope of confidential information covered by the associated Non-Disclosure Agreement. It does not constitute complete technical documentation and is not intended for use as a deployment or development guide.*
