import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getDecryptedGroup } from "./settings.service.js";

interface MailConfig {
  transporter: nodemailer.Transporter;
  fromAddress: string;
  fromName: string;
}

let cached: { config: MailConfig | null; at: number } | null = null;
const CACHE_MS = 60_000;

/**
 * SMTP configured through the admin UI takes precedence over the .env fallback,
 * so operators can change mail settings without a redeploy. Cached briefly
 * because every outbound mail would otherwise cost a settings read plus a
 * decrypt; `resetMailTransport()` clears it when the settings are saved.
 */
async function getMailConfig(): Promise<MailConfig | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.config;

  let config: MailConfig | null = null;
  try {
    const smtp = await getDecryptedGroup("smtp");
    if (smtp.host && smtp.username && smtp.password) {
      config = {
        transporter: nodemailer.createTransport({
          host: String(smtp.host),
          port: Number(smtp.port ?? 587),
          secure: smtp.encryption === "ssl",
          auth: { user: String(smtp.username), pass: String(smtp.password) },
        }),
        fromAddress: String(smtp.fromAddress ?? smtp.username),
        fromName: String(smtp.fromName ?? "PHPStore"),
      };
    }
  } catch (err) {
    logger.error(`Could not read SMTP settings, falling back to environment: ${String(err)}`);
  }

  if (!config && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
    config = {
      transporter: nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      }),
      fromAddress: env.MAIL_FROM ?? env.SMTP_USER,
      fromName: env.MAIL_FROM_NAME ?? "PHPStore",
    };
  }

  cached = { config, at: Date.now() };
  return config;
}

export function resetMailTransport() {
  cached = null;
}

// Email delivery is best-effort: a downed/misconfigured SMTP provider must never
// fail the request that triggered it (registration already committed the user
// to the database by this point). Failures are logged for operators, not thrown.
interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

async function send(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const config = await getMailConfig();
  if (!config) {
    logger.warn(`SMTP not configured; skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await config.transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to,
      subject,
      html,
      attachments,
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

// Order confirmation with the customer invoice attached, matching the legacy
// behaviour of mailing the PDF on order placement.
export function sendOrderConfirmationEmail(
  to: string,
  order: { code: string; grandTotal: number; currency: string },
  invoicePdf: Buffer,
) {
  const link = `${env.NEXT_PUBLIC_APP_URL}/en/dashboard/orders`;
  return send(
    to,
    `Order ${order.code} confirmed`,
    `<p>Thanks for your order.</p>
     <p><strong>Order ${order.code}</strong> — ${order.currency} ${order.grandTotal.toFixed(2)}</p>
     <p>Your invoice is attached. You can follow progress at <a href="${link}">${link}</a>.</p>`,
    [{ filename: `invoice-${order.code}.pdf`, content: invoicePdf, contentType: "application/pdf" }],
  );
}

// Sent one-by-one (not a single BCC blast) so a bad address never exposes the
// rest of the list, and each failure is logged independently by send().
export async function sendNewsletterCampaign(recipients: string[], subject: string, bodyHtml: string) {
  for (const to of recipients) {
    await send(to, subject, bodyHtml);
  }
}
