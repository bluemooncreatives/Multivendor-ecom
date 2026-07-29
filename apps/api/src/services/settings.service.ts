import { BusinessSetting } from "../models/Settings.js";
import { readSecret } from "../utils/secrets.js";

/**
 * The credential groups an admin can edit, and which field of each is a secret.
 *
 * Secrets are write-only end to end: GET returns `{configured, hint}` in their
 * place, and PUT keeps the stored value when the field is omitted. That is what
 * lets a form round-trip without ever holding the real value — sending back what
 * was rendered would otherwise overwrite the secret with its own mask.
 */
export const SECRET_GROUPS = {
  smtp: ["password"],
  storage: ["accessKeyId", "secretAccessKey"],
  socialLogin: ["googleClientSecret", "facebookAppSecret", "twitterClientSecret"],
  recaptcha: ["secretKey"],
} as const;

export type SecretGroup = keyof typeof SECRET_GROUPS;

// `select: false` on these fields means they must be requested explicitly.
export async function loadBusinessSettings() {
  return (
    (await BusinessSetting.findOne({ key: "business" }).select("+smtp +storage +socialLogin +recaptcha")) ??
    (await BusinessSetting.create({}))
  );
}

/**
 * Decrypted credentials for outbound use. Only ever called server-side (opening
 * an SMTP connection, signing an upload) — never returned over HTTP.
 */
export async function getDecryptedGroup(group: SecretGroup): Promise<Record<string, unknown>> {
  const settings = await loadBusinessSettings();
  const stored = (settings.get(group) as Record<string, unknown>) ?? {};

  const resolved: Record<string, unknown> = { ...stored };
  for (const field of SECRET_GROUPS[group]) {
    resolved[field] = readSecret(stored, field);
  }
  return resolved;
}
