import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const MASTER_EMAIL = "info@advisoryconnect.pro";

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string
) {
  if (!apiKey) {
    throw new Error("SendGrid API key not configured");
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) return;

  const msg = {
    to: recipients,
    from: from || MASTER_EMAIL,
    subject,
    html,
  };

  await sgMail.send(msg);
}

export function buildRecipients(...extras: (string | null | undefined)[]): string[] {
  const all = [MASTER_EMAIL, ...extras].filter((e): e is string => !!e && e.includes("@"));
  return [...new Set(all)];
}

export function isSendGridConfigured(): boolean {
  return !!apiKey;
}
