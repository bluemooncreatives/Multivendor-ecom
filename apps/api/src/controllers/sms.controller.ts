import type { Request, Response } from "express";
import { z } from "zod";
import { OtpSetting, SmsLog } from "../models/Settings.js";
import { User } from "../models/User.js";
import { getOtpSettings, sendBulkSms } from "../services/sms.service.js";
import { ApiError } from "../middleware/errorHandler.js";

// Returned without `credentials` (the field is select:false), so the admin UI can
// render the configuration form without ever receiving the provider secrets.
export async function getOtpSettingsHandler(_req: Request, res: Response) {
  res.json(await getOtpSettings());
}

export const otpSettingsSchema = z.object({
  provider: z.enum(["twilio", "nexmo", "msg91", "ssl_wireless", "none"]),
  otpOnRegistration: z.boolean(),
  otpOnForgotPassword: z.boolean(),
  otpOnOrderPlacement: z.boolean(),
  senderId: z.string().max(60).optional(),
});

export async function updateOtpSettingsHandler(req: Request, res: Response) {
  const settings = await OtpSetting.findOneAndUpdate({ key: "otp" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json(settings);
}

export const otpCredentialsSchema = z.object({
  accountSid: z.string().min(1).max(200).optional(),
  authToken: z.string().min(1).max(200).optional(),
  apiKey: z.string().min(1).max(200).optional(),
  from: z.string().min(1).max(40).optional(),
});

// Credentials are written but never read back. The response only confirms which
// keys are now set, so a compromised admin session cannot exfiltrate the secrets.
export async function updateOtpCredentialsHandler(req: Request, res: Response) {
  const settings = await OtpSetting.findOneAndUpdate(
    { key: "otp" },
    { credentials: req.body },
    { upsert: true, new: true, setDefaultsOnInsert: true, select: "+credentials" },
  );
  res.json({ configuredKeys: Object.keys((settings!.credentials ?? {}) as object) });
}

export const sendSmsSchema = z.object({
  message: z.string().min(1).max(600),
  audience: z.enum(["all", "customers", "sellers"]),
});

export async function sendBulkSmsHandler(req: Request, res: Response) {
  const settings = await getOtpSettings();
  if (settings.provider === "none") throw new ApiError(409, "Configure an SMS provider first");

  const roleFilter =
    req.body.audience === "customers" ? { role: "customer" } : req.body.audience === "sellers" ? { role: "seller" } : {};

  // Only accounts with a verified phone are messaged — texting unverified numbers
  // risks spamming someone who never confirmed the number is theirs.
  const recipients = await User.find({
    ...roleFilter,
    banned: false,
    phone: { $nin: [null, ""] },
    phoneVerifiedAt: { $ne: null },
  }).select("phone");

  const phones = [...new Set(recipients.map((u) => u.phone!).filter(Boolean))];
  if (phones.length === 0) throw new ApiError(400, "No verified phone numbers match that audience");

  const result = await sendBulkSms(phones, req.body.message);

  await SmsLog.create({
    sentBy: req.user!.id,
    message: req.body.message,
    audience: req.body.audience,
    recipientCount: result.sent,
    provider: settings.provider,
  });

  res.json({ recipients: phones.length, ...result });
}

export async function listSmsLogsHandler(_req: Request, res: Response) {
  const items = await SmsLog.find().populate("sentBy", "name email").sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}
