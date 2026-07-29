import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// AES-256-GCM: authenticated, so a tampered ciphertext fails to decrypt rather
// than silently yielding garbage that then gets sent to a payment gateway.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const PREFIX = "enc:v1:";

// The configured passphrase is hashed to exactly 32 bytes rather than requiring a
// hex key of the right length, so operators can use any sufficiently long secret.
function key(): Buffer {
  if (!env.SETTINGS_ENCRYPTION_KEY) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is required to store provider credentials");
  }
  return createHash("sha256").update(env.SETTINGS_ENCRYPTION_KEY).digest();
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) return stored; // pre-encryption value, returned as-is

  const [iv, tag, ciphertext] = stored.slice(PREFIX.length).split(".");
  if (!iv || !tag || !ciphertext) throw new Error("Malformed encrypted value");

  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

/**
 * What the admin UI is allowed to see: whether a secret is set, and just enough
 * of it to tell two keys apart. Never the value itself — the legacy settings form
 * rendered live gateway keys straight into the HTML.
 */
export interface SecretStatus {
  configured: boolean;
  hint: string | null;
}

export function describeSecret(stored: string | null | undefined): SecretStatus {
  if (!stored) return { configured: false, hint: null };

  try {
    const plaintext = decryptSecret(stored);
    // Last four characters only, and only when there is enough left over that the
    // hint cannot reconstruct a short secret.
    const hint = plaintext.length > 8 ? `••••${plaintext.slice(-4)}` : "••••";
    return { configured: true, hint };
  } catch {
    logger.error("A stored secret could not be decrypted — SETTINGS_ENCRYPTION_KEY may have changed");
    return { configured: true, hint: null };
  }
}

/**
 * Applies an incoming settings patch to stored credentials.
 *
 * Fields the client omits keep their current value, and the sentinel below lets
 * the UI clear one explicitly. This is what makes write-only secrets workable:
 * the form never receives the value, so it cannot send it back, and an untouched
 * field must not wipe what is stored.
 */
export const CLEAR_SECRET = "__clear__";

export function mergeSecrets(
  existing: Record<string, unknown> = {},
  incoming: Record<string, unknown> = {},
  secretFields: readonly string[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...existing };

  for (const [field, value] of Object.entries(incoming)) {
    if (!secretFields.includes(field)) {
      merged[field] = value;
      continue;
    }

    if (value === undefined || value === null || value === "") continue; // untouched
    if (value === CLEAR_SECRET) {
      merged[field] = null;
      continue;
    }
    merged[field] = encryptSecret(String(value));
  }

  return merged;
}

/** Replaces every secret field with its status, for sending to the browser. */
export function maskSecrets(
  stored: Record<string, unknown> = {},
  secretFields: readonly string[],
): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...stored };
  for (const field of secretFields) {
    masked[field] = describeSecret(stored[field] as string | null | undefined);
  }
  return masked;
}

/** Reads a credential for outbound use (calling a gateway, opening SMTP). */
export function readSecret(stored: Record<string, unknown> = {}, field: string): string | null {
  const value = stored[field];
  if (typeof value !== "string" || value === "") return null;
  return decryptSecret(value);
}

/** Constant-time compare, for verifying gateway callback signatures. */
export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
