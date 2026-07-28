import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
const transporter = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    })
    : null;
async function send(to, subject, html) {
    if (!transporter) {
        logger.warn(`SMTP not configured; skipping email to ${to}: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from: `"${env.MAIL_FROM_NAME ?? "PHPStore"}" <${env.MAIL_FROM ?? env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
}
export function sendVerificationEmail(to, token) {
    const link = `${env.NEXT_PUBLIC_APP_URL}/en/verify-email?token=${encodeURIComponent(token)}`;
    return send(to, "Verify your email", `<p>Confirm your email address to activate your account.</p><p><a href="${link}">${link}</a></p><p>This link expires in 6 hours.</p>`);
}
export function sendPasswordResetEmail(to, token) {
    const link = `${env.NEXT_PUBLIC_APP_URL}/en/reset-password?token=${encodeURIComponent(token)}`;
    return send(to, "Reset your password", `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`);
}
//# sourceMappingURL=email.service.js.map