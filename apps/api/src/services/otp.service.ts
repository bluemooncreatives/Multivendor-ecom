import twilio from "twilio";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../middleware/errorHandler.js";

const client =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

export async function sendPhoneOtp(phone: string): Promise<void> {
  if (!client || !env.TWILIO_VERIFY_SERVICE_SID) {
    logger.warn(`Twilio not configured; skipping OTP send to ${phone}`);
    return;
  }
  await client.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phone, channel: "sms" });
}

export async function checkPhoneOtp(phone: string, code: string): Promise<boolean> {
  if (!client || !env.TWILIO_VERIFY_SERVICE_SID) {
    throw new ApiError(503, "OTP verification is not configured");
  }
  const result = await client.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
  return result.status === "approved";
}
