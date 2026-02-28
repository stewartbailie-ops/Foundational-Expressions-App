import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export async function sendEmail(to: string, subject: string, html: string, from?: string) {
  if (!apiKey) {
    throw new Error("SendGrid API key not configured");
  }

  const msg = {
    to,
    from: from || "info@advisoryconnect.pro",
    subject,
    html,
  };

  await sgMail.send(msg);
}

export function isSendGridConfigured(): boolean {
  return !!apiKey;
}