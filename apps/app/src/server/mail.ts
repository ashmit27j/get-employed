import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

/**
 * Transactional mail (reset codes, verification). Resend if RESEND_API_KEY is set, otherwise SMTP,
 * otherwise, in development only, the message is printed to the server console.
 * Outreach email to recruiters goes through the user's own mailbox instead (docs/email-and-google.md).
 */
export async function sendMail(mail: Mail): Promise<void> {
  const e = env();
  if (e.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${e.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: e.EMAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend rejected the message (${res.status})`);
    return;
  }
  if (e.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: e.SMTP_HOST,
      port: e.SMTP_PORT,
      secure: e.SMTP_PORT === 465,
      auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({ from: e.EMAIL_FROM, ...mail });
    return;
  }
  if (e.NODE_ENV !== "production") {
    console.info(`\n[mail] to ${mail.to}: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP_HOST.");
}
