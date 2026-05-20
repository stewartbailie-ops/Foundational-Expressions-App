import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = "noreply@advisoryconnect.pro";
const REPLY_TO_EMAIL = "info@advisoryconnect.pro";
const MASTER_INBOX = "info@advisoryconnect.pro";

// F3 — branded email shell. Wraps any plain inner HTML body in a consistent
// dark Advisory Connect header (icon + wordmark, hosted on prod) and a small
// footer. Email clients are conservative about CSS so this is all inline
// styles + table-friendly markup. Absolute https URLs are used for the logos
// because mail clients don't load relative paths.
const PROD_ORIGIN = "https://app.advisoryconnect.pro";

export function brandedEmail(innerHtml: string, opts?: { previewText?: string }): string {
  const preview = opts?.previewText ? opts.previewText.slice(0, 200) : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Advisory Connect</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fa;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <tr><td style="background:#0a0e1a;padding:18px 24px;" align="left">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td style="vertical-align:middle;padding-right:12px;"><img src="${PROD_ORIGIN}/logo/icon-64.png" width="36" height="36" alt="Advisory Connect" style="display:block;border:0;"/></td>
          <td style="vertical-align:middle;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.2px;">Advisory Connect</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:24px;">${innerHtml}</td></tr>
      <tr><td style="background:#0a0e1a;padding:14px 24px;color:#9ca3af;font-size:11px;line-height:1.5;" align="center">
        Advisory Connect &middot; <a href="${PROD_ORIGIN}" style="color:#9ca3af;text-decoration:none;">advisoryconnect.pro</a> &middot; <a href="mailto:${REPLY_TO_EMAIL}" style="color:#9ca3af;text-decoration:none;">${REPLY_TO_EMAIL}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string,
  opts?: {
    wrap?: boolean;
    previewText?: string;
    // Task #44 — public-profile Scan Documents tool forwards client uploads
    // as SendGrid attachments. `content` MUST be base64-encoded bytes.
    attachments?: Array<{ filename: string; content: string; type?: string; disposition?: string }>;
    replyTo?: string;
  }
) {
  if (!apiKey) {
    throw new Error("SendGrid API key not configured");
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return;

  // Auto-wrap with the branded shell unless explicitly opted out, or unless
  // the caller is already supplying a full HTML document (covers both
  // <!doctype html> declarations and bare <html> roots).
  const looksLikeFullDoc = /<!doctype\s+html|<html[\s>]/i.test(html);
  const shouldWrap = (opts?.wrap ?? true) && !looksLikeFullDoc;
  const finalHtml = shouldWrap ? brandedEmail(html, { previewText: opts?.previewText }) : html;

  const msg: any = {
    to: recipients,
    from: from || FROM_EMAIL,
    replyTo: opts?.replyTo || REPLY_TO_EMAIL,
    subject,
    html: finalHtml,
  };
  if (opts?.attachments && opts.attachments.length > 0) {
    msg.attachments = opts.attachments.map(a => ({
      filename: a.filename,
      content: a.content,
      type: a.type || "application/octet-stream",
      disposition: a.disposition || "attachment",
    }));
  }

  await sgMail.send(msg);
}

export function buildRecipients(...extras: (string | null | undefined)[]): string[] {
  const all = [MASTER_INBOX, ...extras].filter((e): e is string => !!e && e.includes("@"));
  return [...new Set(all)];
}

export function isSendGridConfigured(): boolean {
  return !!apiKey;
}

// Task #26 — trial-expiry nudge. Sent 2 days before trialEndsAt so the advisor
// can either add a card (Basic / Premium) or simply let the trial lapse without
// being charged. Copy is supportive, not alarmist — Stewart's brand voice.
export async function sendTrialExpiryEmail(args: {
  to: string;
  name: string;
  daysLeft: number;
  upgradeUrl: string;
}): Promise<void> {
  const inner = `
    <h2 style="margin:0 0 12px;font-size:20px;color:#0a0e1a;">Your trial ends in ${args.daysLeft} day${args.daysLeft === 1 ? "" : "s"}</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">Hi ${args.name},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#374151;">
      Just a heads-up: your 14-day free trial of Advisory Connect ends in ${args.daysLeft} day${args.daysLeft === 1 ? "" : "s"}.
      No card on file, so nothing will be charged automatically — but your profile will switch to read-only and new lead forms will stop accepting submissions when the trial lapses.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#374151;">
      To keep your profile live, pick a plan below. Basic keeps everything you've been using; Premium adds advanced analytics, practice management, and white-label business cards.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${args.upgradeUrl}" style="display:inline-block;background:#0a0e1a;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Choose a plan</a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
      Questions? Just reply to this email — it goes straight to ${REPLY_TO_EMAIL}.
    </p>
  `;
  await sendEmail(args.to, `Your Advisory Connect trial ends in ${args.daysLeft} day${args.daysLeft === 1 ? "" : "s"}`, inner, undefined, {
    previewText: `Pick a plan to keep your profile live — Basic R299/mo or Premium R499/mo.`,
  });
}
