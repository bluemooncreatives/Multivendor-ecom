import twilio from "twilio";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { PhoneChallenge } from "../models/PhoneChallenge.js";
import { Addon, OtpSetting } from "../models/Settings.js";
import { getSmsSender } from "./sms.service.js";

export type OtpPurpose = "login" | "password_reset" | "verify_phone" | "registration";

export async function phoneAuthOptions() {
  const [settings, addon] = await Promise.all([OtpSetting.findOne({ key: "otp" }), Addon.findOne({ key: "otp" })]);
  // Existing env-only Verify deployments remain usable until a DB provider is
  // selected. An explicitly disabled provider or add-on always wins.
  const legacyVerify = !settings && Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
  const enabled = addon?.enabled !== false && (addon?.enabled === true || legacyVerify) &&
    (settings ? settings.provider !== "none" : legacyVerify);
  return { login: enabled, registration: enabled, verification: enabled, passwordReset: enabled && (settings?.otpOnForgotPassword ?? legacyVerify),
    registrationRequired: enabled && settings?.otpOnRegistration === true };
}

async function assertPurpose(purpose: OtpPurpose) {
  const options = await phoneAuthOptions();
  if (!options.verification) throw new ApiError(503, "Phone verification is disabled or not configured");
  if (purpose === "password_reset" && !options.passwordReset) throw new ApiError(403, "Password reset by phone is disabled");
}

function verifyClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) throw new ApiError(503, "OTP verification is not configured");
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, { timeout: 10000, autoRetry: false }).verify.v2.services(env.TWILIO_VERIFY_SERVICE_SID);
}

function hashCode(phone: string, nonce: string, purpose: string, code: string) {
  return createHmac("sha256", env.JWT_ACCESS_SECRET).update(`${phone}\0${nonce}\0${purpose}\0${code}`).digest("hex");
}

export async function sendPhoneOtp(phone: string, purpose: OtpPurpose = "login", userId?: string): Promise<void> {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new ApiError(422, "Use an international phone number beginning with +");
  await assertPurpose(purpose);
  const settings = await OtpSetting.findOne({ key: "otp" });
  const transport = settings ? "sms" : "twilio_verify";
  const sender = transport === "sms" ? await getSmsSender() : null;
  const nonce = randomUUID();
  const code = String(randomInt(100000, 1000000));
  const now = new Date();
  try {
    await PhoneChallenge.findOneAndUpdate({ _id: phone, resendAfter: { $lte: now } }, { $set: {
      nonce, purpose, userId: userId ?? null, transport, codeHash: transport === "sms" ? hashCode(phone, nonce, purpose, code) : null,
      status: "pending", attempts: 0, consumedAt: null, resendAfter: new Date(now.getTime() + 60000), expiresAt: new Date(now.getTime() + 300000),
    } }, { upsert: true, new: true });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new ApiError(429, "Wait a minute before requesting another code");
    throw error;
  }
  try {
    if (sender) await sender(phone, `${code} is your verification code. It expires in 5 minutes.`);
    else await verifyClient().verifications.create({ to: phone, channel: "sms" });
    await PhoneChallenge.updateOne({ _id: phone, nonce }, { status: "sent" });
  } catch {
    // Preserve the resend deadline after an ambiguous network failure. Never
    // expose the OTP, recipient or provider's credential-bearing error payload.
    await PhoneChallenge.updateOne({ _id: phone, nonce }, { status: "failed" });
    throw new ApiError(503, "The verification message could not be sent; please try again later");
  }
}

export async function checkPhoneOtp(phone: string, code: string, purpose: OtpPurpose = "login", userId?: string): Promise<boolean> {
  await assertPurpose(purpose);
  const challenge = await PhoneChallenge.findOneAndUpdate({ _id: phone, purpose, userId: userId ?? null,
    status: "sent", consumedAt: null, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 },
  }, { $inc: { attempts: 1 } }, { new: true }).select("+codeHash");
  if (!challenge) return false;
  let correct = false;
  if (challenge.transport === "sms") {
    const expected = Buffer.from(challenge.codeHash ?? "", "hex");
    const actual = Buffer.from(hashCode(phone, challenge.nonce, purpose, code), "hex");
    correct = expected.length === actual.length && timingSafeEqual(expected, actual);
  } else {
    try { correct = (await verifyClient().verificationChecks.create({ to: phone, code })).status === "approved"; }
    catch { return false; }
  }
  if (!correct) return false;
  const consumed = await PhoneChallenge.updateOne({ _id: phone, nonce: challenge.nonce, consumedAt: null, expiresAt: { $gt: new Date() } }, { consumedAt: new Date() });
  return consumed.modifiedCount === 1;
}
