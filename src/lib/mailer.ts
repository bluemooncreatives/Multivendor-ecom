import "server-only";

import nodemailer from "nodemailer";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]!));
}

function transport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.MAIL_FROM) throw new Error("SMTP is not fully configured");
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

async function send(to: string, subject: string, intro: string, action: string, actionUrl: string): Promise<void> {
  const fromName = process.env.MAIL_FROM_NAME || "V4Local";
  await transport().sendMail({
    from: { name: fromName, address: process.env.MAIL_FROM! },
    to,
    subject,
    text: `${intro}\n\n${action}: ${actionUrl}\n\nIf you did not request this, you can ignore this message.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124"><h2>${escapeHtml(fromName)}</h2><p>${escapeHtml(intro)}</p><p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 18px;background:#174ea6;color:#fff;text-decoration:none;border-radius:6px">${escapeHtml(action)}</a></p><p style="font-size:13px;color:#666">If you did not request this, you can ignore this message.</p></div>`,
  });
}

export function sendVerificationEmail(email: string, token: string): Promise<void> {
  return send(email, "Verify your V4Local email", "Confirm this email address to activate your marketplace account.", "Verify email", `${appUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  return send(email, "Reset your V4Local password", "A password reset was requested for your marketplace account. This link expires in one hour.", "Reset password", `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`);
}
