---
name: reCAPTCHA key validation + wiring
description: How to diagnose a non-working reCAPTCHA without exposing secret values, and the build-time gotcha for the site key.
---
# reCAPTCHA keys — validation & gotchas

**Key format:** valid Google reCAPTCHA v2 keys (both site and secret) are exactly
40 chars and start with `6L`. A length other than 40 = truncated/corrupt key. The
front-end widget hides itself on an invalid key (`onErrored → setRenFailed(true)`),
so a malformed site key looks like "reCAPTCHA just isn't showing up."

**Validate the SECRET without a real token (non-destructive):** POST to
`https://www.google.com/recaptcha/api/siteverify` with the secret + a dummy
`response`. `error-codes: ["invalid-input-response"]` = secret ACCEPTED (only the
token was bad). `["invalid-input-secret"]` = secret is wrong/mismatched.

**Build-time gotcha:** the site key is `VITE_RECAPTCHA_SITE_KEY` — a Vite build-time
env var baked into the client bundle. After changing it: restart the dev workflow
for development, and **republish** for production (a redeploy rebuilds the bundle).
The secret is `RECAPTCHA_SECRET_KEY` (server-side, picked up on restart).

**Pairing:** site key and secret MUST come from the same Google site registration
or verification always fails. reCAPTCHA domain matching covers subdomains, so a site
registered for `advisoryconnect.pro` also covers `app.advisoryconnect.pro`.

**Why:** site key is public (embedded in HTML) — safe to handle as a shared env var.
