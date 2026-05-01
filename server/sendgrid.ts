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
const PROD_ORIGIN = "https://advisoryconnect.pro";

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
  opts?: { wrap?: boolean; previewText?: string }
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

  const msg = {
    to: recipients,
    from: from || FROM_EMAIL,
    replyTo: REPLY_TO_EMAIL,
    subject,
    html: finalHtml,
  };

  await sgMail.send(msg);
}

export function buildRecipients(...extras: (string | null | undefined)[]): string[] {
  const all = [MASTER_INBOX, ...extras].filter((e): e is string => !!e && e.includes("@"));
  return [...new Set(all)];
}

export function isSendGridConfigured(): boolean {
  return !!apiKey;
}
