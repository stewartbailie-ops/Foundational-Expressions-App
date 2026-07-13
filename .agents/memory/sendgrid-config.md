---
name: SendGrid configuration
description: How email is actually wired in this app — raw API key, not the Replit connector.
---

# SendGrid config gotcha

Email in this app is sent via `@sendgrid/mail`, reading `process.env.SENDGRID_API_KEY` directly at module load (`server/sendgrid.ts`). `isSendGridConfigured()` gates all send paths and the trial-expiry cron.

**Why:** Adding the Replit **SendGrid connector/integration does NOT make email work here.** The connector exposes a proxy SDK; the app code never calls it. Only the raw `SENDGRID_API_KEY` Replit Secret feeds the code.

**How to apply:**
- To enable email: set the `SENDGRID_API_KEY` secret, then restart the workflow (key is read once at startup, not per-request).
- Symptoms of missing/incorrect key: logs show `SendGrid not configured — skipping trial-expiry sweep` and `Verification email error: SendGrid API key not configured` (500 on setup/OTP).
- From/reply-to are hardcoded (`noreply@advisoryconnect.pro` / `info@advisoryconnect.pro`) — no separate env var needed.
- Also referenced: `SENDGRID_WEBHOOK_SECRET` for inbound webhook verification (separate secret).
