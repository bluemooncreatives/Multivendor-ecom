import twilio from "twilio";
import { OtpSetting } from "../models/Settings.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

// Credentials are `select: false` on the model, so they must be asked for
// explicitly — this is the only place that does.
export async function getOtpSettingsWithCredentials() {
  return (await OtpSetting.findOne({ key: "otp" }).select("+credentials")) ?? (await OtpSetting.create({}));
}

export async function getOtpSettings() {
  return (await OtpSetting.findOne({ key: "otp" })) ?? (await OtpSetting.create({}));
}

interface SmsResult {
  sent: number;
  failed: number;
}

// DB-configured credentials take precedence over the environment, so an admin can
// rotate an SMS provider without a redeploy; env stays the fallback for local dev.
async function twilioClient() {
  const settings = await getOtpSettingsWithCredentials();
  const creds = (settings.credentials ?? {}) as { accountSid?: string; authToken?: string; from?: string };

  const sid = creds.accountSid ?? env.TWILIO_ACCOUNT_SID;
  const token = creds.authToken ?? env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;

  return { client: twilio(sid, token), from: creds.from ?? settings.senderId };
}

// Bulk sends are chunked and failure-tolerant: one bad number must not abort the
// blast, and the caller gets an accurate sent/failed split for the audit log.
export async function sendBulkSms(phones: string[], message: string): Promise<SmsResult> {
  const config = await twilioClient();
  if (!config?.from) throw new ApiError(503, "No SMS provider is configured");

  const result: SmsResult = { sent: 0, failed: 0 };
  const BATCH = 20;

  for (let i = 0; i < phones.length; i += BATCH) {
    const batch = phones.slice(i, i + BATCH);
    const outcomes = await Promise.allSettled(
      batch.map((to) => config.client.messages.create({ to, from: config.from!, body: message })),
    );
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") result.sent += 1;
      else {
        result.failed += 1;
        logger.warn("SMS delivery failed", outcome.reason);
      }
    }
  }

  return result;
}
