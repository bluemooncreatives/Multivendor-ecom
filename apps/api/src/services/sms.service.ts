import twilio from "twilio";
import { OtpSetting } from "../models/Settings.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../middleware/errorHandler.js";
import { readSecret } from "../utils/secrets.js";
import { randomBytes } from "node:crypto";

export const OTP_CREDENTIAL_SECRETS = ["accountSid", "authToken", "apiKey", "apiSecret"] as const;

// Credentials are `select: false` on the model, so they must be asked for
// explicitly — this is the only place that does.
export async function getOtpSettingsWithCredentials() {
  return OtpSetting.findOneAndUpdate({ key: "otp" }, { $setOnInsert: { key: "otp" } }, { upsert: true, new: true }).select("+credentials");
}

export async function getOtpSettings() {
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID) {
    const existing = await OtpSetting.findOne({ key: "otp" });
    // Merely opening the admin screen must not create a disabled DB provider
    // and replace an existing env-only Verify deployment.
    if (!existing) return new OtpSetting({ provider: "none", otpOnForgotPassword: true });
    return existing;
  }
  return OtpSetting.findOneAndUpdate({ key: "otp" }, { $setOnInsert: { key: "otp" } }, { upsert: true, new: true });
}

interface SmsResult {
  sent: number;
  failed: number;
}

function requireValue(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(503, `Configure the SMS ${name} first`);
  return value;
}

function phoneNumber(phone: string) {
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new ApiError(422, "Use an international phone number beginning with +");
  return phone.slice(1);
}

interface ProviderResponse {
  messages?: { status?: string }[];
  type?: string;
  status?: string;
  status_code?: number;
  smsinfo?: { sms_status?: string }[];
  return?: boolean;
}

async function smsHttp(url: string, body: string | URLSearchParams, headers: Record<string, string>) {
  try {
    const response = await fetch(url, { method: "POST", body, headers, signal: AbortSignal.timeout(10000), redirect: "error" });
    if (!response.ok) throw new Error("Provider rejected request");
    return await response.json() as ProviderResponse;
  } catch { throw new ApiError(502, "The SMS provider could not accept the message"); }
}

/** Resolve one provider per operation; changing the setting takes effect on the next send. */
export async function getSmsSender(): Promise<(phone: string, message: string) => Promise<void>> {
  const settings = await getOtpSettingsWithCredentials();
  if (!settings || settings.provider === "none") throw new ApiError(503, "No SMS provider is configured");
  const stored = (settings.credentials ?? {}) as Record<string, unknown>;
  const creds = { ...stored };
  for (const key of OTP_CREDENTIAL_SECRETS) creds[key] = readSecret(stored, key);
  const from = creds.from || settings.senderId;
  const rejected = () => { throw new ApiError(502, "The SMS provider rejected the message"); };

  if (settings.provider === "twilio") {
    const sid = requireValue(creds.accountSid ?? env.TWILIO_ACCOUNT_SID, "account SID");
    const token = requireValue(creds.authToken ?? env.TWILIO_AUTH_TOKEN, "auth token");
    const sender = requireValue(from, "sender");
    const client = twilio(sid, token, { timeout: 10000, autoRetry: false });
    return async (phone, body) => {
      phoneNumber(phone);
      try {
        const response = await client.messages.create({ to: phone, from: sender, body });
        if (response.status === "failed" || response.status === "undelivered") rejected();
      } catch { rejected(); }
    };
  }
  if (settings.provider === "nexmo") {
    const key = requireValue(creds.apiKey || creds.accountSid, "API key");
    const secret = requireValue(creds.apiSecret || creds.authToken, "API secret");
    const sender = requireValue(from, "sender");
    return async (phone, text) => {
      const body = new URLSearchParams({ from: sender, to: phoneNumber(phone), text,
        type: /[^\x00-\x7F]/.test(text) ? "unicode" : "text" });
      if (creds.entityId) body.set("entity-id", String(creds.entityId));
      if (creds.templateId) body.set("content-id", String(creds.templateId));
      const result = await smsHttp("https://rest.nexmo.com/sms/json", body, {
        "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      });
      if (result.messages?.length !== 1 || result.messages[0]?.status !== "0") rejected();
    };
  }
  if (settings.provider === "ssl_wireless") {
    const token = requireValue(creds.apiKey || creds.authToken, "API token");
    const sid = requireValue(creds.sid || from, "SID");
    return async (phone, sms) => {
      const result = await smsHttp("https://smsplus.sslwireless.com/api/v3/send-sms", JSON.stringify({
        api_token: token, sid, msisdn: phoneNumber(phone), sms, csms_id: randomBytes(10).toString("hex"),
      }), { "Content-Type": "application/json" });
      if (result.status_code !== 200 || result.status !== "SUCCESS" || result.smsinfo?.length !== 1 || result.smsinfo[0]?.sms_status !== "SUCCESS") rejected();
    };
  }
  if (settings.provider === "msg91") {
    const key = requireValue(creds.apiKey || creds.authToken, "API key");
    const sender = requireValue(from, "sender");
    return async (phone, message) => {
      const result = await smsHttp("https://api.msg91.com/api/v2/sendsms", JSON.stringify({ sender, route: "4", country: "0",
        sms: [{ message, to: [phoneNumber(phone)], ...(creds.templateId ? { DLT_TE_ID: creds.templateId } : {}) }],
      }), { "Content-Type": "application/json", authkey: key });
      if (result.type !== "success") rejected();
    };
  }
  if (settings.provider === "fast2sms") {
    const key = requireValue(creds.apiKey || creds.authToken, "API key");
    const route = creds.route || "q";
    if (!["q", "dlt_manual"].includes(String(route))) throw new ApiError(503, "Choose a supported Fast2SMS route");
    const template = route === "dlt_manual" ? {
      sender_id: requireValue(from, "sender"), entity_id: requireValue(creds.entityId, "entity ID"), template_id: requireValue(creds.templateId, "template ID"),
    } : {};
    return async (phone, message) => {
      const digits = phoneNumber(phone);
      if (!/^91\d{10}$/.test(digits)) throw new ApiError(422, "Fast2SMS requires an Indian phone number");
      const result = await smsHttp("https://www.fast2sms.com/dev/bulkV2", JSON.stringify({ route, message, numbers: digits.slice(2), ...template }),
        { "Content-Type": "application/json", authorization: key });
      if (result.return !== true) rejected();
    };
  }
  throw new ApiError(503, "Unsupported SMS provider");
}

export async function sendSms(phone: string, message: string) {
  await (await getSmsSender())(phone, message);
}

// Bulk sends are chunked and failure-tolerant: one bad number must not abort the
// blast, and the caller gets an accurate sent/failed split for the audit log.
export async function sendBulkSms(phones: string[], message: string): Promise<SmsResult> {
  const send = await getSmsSender();
  const uniquePhones = [...new Set(phones)];

  const result: SmsResult = { sent: 0, failed: 0 };
  const BATCH = 20;

  for (let i = 0; i < uniquePhones.length; i += BATCH) {
    const batch = uniquePhones.slice(i, i + BATCH);
    const outcomes = await Promise.allSettled(
      batch.map((to) => send(to, message)),
    );
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") result.sent += 1;
      else {
        result.failed += 1;
        // Provider errors can contain credentials, phone numbers or OTP text.
        logger.warn("SMS provider did not accept a recipient's message");
      }
    }
  }

  return result;
}
