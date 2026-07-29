import type { Request, Response } from "express";
import { z } from "zod";
import { SellerVerificationField } from "../models/Settings.js";
import { mergeSecrets, maskSecrets, CLEAR_SECRET } from "../utils/secrets.js";
import { SECRET_GROUPS, loadBusinessSettings, type SecretGroup } from "../services/settings.service.js";
import { resetMailTransport } from "../services/email.service.js";
import { ApiError } from "../middleware/errorHandler.js";

const groupSchemas: Record<SecretGroup, z.ZodTypeAny> = {
  smtp: z.object({
    driver: z.enum(["smtp", "sendmail", "mailgun"]).optional(),
    host: z.string().optional(),
    port: z.coerce.number().int().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    encryption: z.enum(["tls", "ssl", "none"]).optional(),
    fromAddress: z.string().email().optional(),
    fromName: z.string().optional(),
  }),
  storage: z.object({
    driver: z.enum(["local", "s3", "cloudinary"]).optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().optional(),
    bucket: z.string().optional(),
    endpoint: z.string().optional(),
  }),
  socialLogin: z.object({
    googleEnabled: z.boolean().optional(),
    googleClientId: z.string().optional(),
    googleClientSecret: z.string().optional(),
    facebookEnabled: z.boolean().optional(),
    facebookAppId: z.string().optional(),
    facebookAppSecret: z.string().optional(),
    twitterEnabled: z.boolean().optional(),
    twitterClientId: z.string().optional(),
    twitterClientSecret: z.string().optional(),
  }),
  recaptcha: z.object({
    enabled: z.boolean().optional(),
    siteKey: z.string().optional(),
    secretKey: z.string().optional(),
  }),
};

function assertGroup(name: string): SecretGroup {
  if (!(name in SECRET_GROUPS)) throw new ApiError(404, `Unknown settings group: ${name}`);
  return name as SecretGroup;
}

export async function getSettingsGroupHandler(req: Request, res: Response) {
  const group = assertGroup(String(req.params.group));
  const settings = await loadBusinessSettings();
  const stored = (settings.get(group) as Record<string, unknown>) ?? {};

  res.json(maskSecrets(stored, SECRET_GROUPS[group]));
}

export async function updateSettingsGroupHandler(req: Request, res: Response) {
  const group = assertGroup(String(req.params.group));
  const parsed = groupSchemas[group].parse(req.body);

  const settings = await loadBusinessSettings();
  const stored = (settings.get(group) as Record<string, unknown>) ?? {};
  const merged = mergeSecrets(stored, parsed as Record<string, unknown>, SECRET_GROUPS[group]);

  settings.set(group, merged);
  await settings.save();

  // The mail transport is built from these values and cached, so saving must
  // invalidate it rather than leaving the old connection in place for a minute.
  if (group === "smtp") resetMailTransport();

  res.json(maskSecrets(merged, SECRET_GROUPS[group]));
}

export { CLEAR_SECRET };

// --- Seller verification form builder ----------------------------------------

const verificationFieldShape = z.object({
  label: z.string().min(1).max(120),
  type: z.enum(["text", "select", "multi_select", "radio", "file"]),
  options: z.array(z.string().min(1)).default([]),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

const OPTIONS_MESSAGE = { message: "Choice fields need at least one option", path: ["options"] };

function requiresOptions(v: { type?: string; options?: string[] }): boolean {
  return !["select", "multi_select", "radio"].includes(v.type ?? "") || (v.options?.length ?? 0) > 0;
}

export const verificationFieldSchema = verificationFieldShape.refine((v) => requiresOptions(v), OPTIONS_MESSAGE);

// `.partial()` has to be taken from the plain object — a refined schema is a
// ZodEffects and no longer exposes it.
export const verificationFieldPatchSchema = verificationFieldShape
  .partial()
  .refine((v) => requiresOptions(v), OPTIONS_MESSAGE);

export async function listVerificationFieldsHandler(_req: Request, res: Response) {
  res.json({ items: await SellerVerificationField.find({ active: true }).sort({ order: 1, createdAt: 1 }) });
}

export async function listAllVerificationFieldsHandler(_req: Request, res: Response) {
  res.json({ items: await SellerVerificationField.find().sort({ order: 1, createdAt: 1 }) });
}

export async function createVerificationFieldHandler(req: Request, res: Response) {
  res.status(201).json(await SellerVerificationField.create(req.body));
}

export async function updateVerificationFieldHandler(req: Request, res: Response) {
  const field = await SellerVerificationField.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!field) throw new ApiError(404, "Verification field not found");
  res.json(field);
}

// Deactivated rather than deleted: shops that already answered this question keep
// a reference to it, and a hard delete would orphan those submitted answers.
export async function deleteVerificationFieldHandler(req: Request, res: Response) {
  const field = await SellerVerificationField.findByIdAndUpdate(req.params.id, { active: false });
  if (!field) throw new ApiError(404, "Verification field not found");
  res.status(204).send();
}
