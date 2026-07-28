import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      })
    : null;

// Email delivery is best-effort: a downed/misconfigured SMTP provider must never
// fail the request that triggered it (registration already committed the user
// to the database by this point). Failures are logged for operators, not thrown.
async function send(to: string, subject: string, html: string) {
  if (!transporter) {
    logger.warn(`SMTP not configured; skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${env.MAIL_FROM_NAME ?? "PHPStore"}" <${env.MAIL_FROM ?? env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${subject}`, err);
  }
}

export function sendVerificationEmail(to: string, token: string) {
  const link = `${env.NEXT_PUBLIC_APP_URL}/en/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Verify your email",
    `<p>Confirm your email address to activate your account.</p><p><a href="${link}">${link}</a></p><p>This link expires in 6 hours.</p>`,
  );
}

export function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.NEXT_PUBLIC_APP_URL}/en/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Reset your password",
    `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
  );
}
