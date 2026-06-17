---
name: Advisor onboarding + email-OTP verification flow
description: How self-registration, password setup, and the email OTP step fit together — and the gotcha that silently disabled the OTP.
---
# Advisor onboarding / OTP verification

**Flow:** `/api/register` creates the advisor (no password). Advisor then visits
`/advisor/:slug` → SetupScreen (email + create password) → `/api/advisor-auth/:slug/setup`.
That endpoint branches on `advisor_email_verified`:
- verified=true  → sets password directly, returns `{verified:true}`, logs straight in (NO OTP).
- verified=false → stashes `setup_hash` in session, generates OTP, emails it, returns `{success:true}`.

Frontend (`AdvisorPanel.tsx`) state machine: setup → if `data.verified` onDone(),
else onVerificationSent() → "verify" → VerifyScreen (6-digit InputOTP + resend on 60s
timer) → `/api/advisor-auth/:slug/verify-otp` → sets verified+password, logs in.

**Gotcha:** `/api/register` originally INSERTed `advisor_email_verified = true`, which made
the setup step ALWAYS take the verified branch — so the OTP email was never sent and the
verify screen never showed, for EVERY self-registered email (not just pre-existing ones).
Fix = insert `false` so real email verification engages. The whole verify UI was already
built; only that one boolean blocked it.

**Why it matters:** auto-verifying at registration also means email ownership is never
proven (anyone can register under any address) — flagged in threat_model.md as an
onboarding/EoP gap. Keeping registration unverified closes it.

**Org-admin-created advisors** are intentionally pre-verified (set true elsewhere) and skip
OTP — that path is separate and should stay as-is.
