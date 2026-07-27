import "server-only";

import crypto from "node:crypto";
import type { Types } from "mongoose";
import { AccountTokenModel } from "@/models";

export type AccountTokenPurpose = "password-reset" | "email-verification";

export function accountTokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createAccountToken(user: Types.ObjectId, email: string, purpose: AccountTokenPurpose, lifetimeMinutes: number): Promise<string> {
  const token = crypto.randomBytes(48).toString("base64url");
  await AccountTokenModel.deleteMany({ user, purpose, usedAt: null });
  await AccountTokenModel.create({ user, email, purpose, tokenHash: accountTokenHash(token), expiresAt: new Date(Date.now() + lifetimeMinutes * 60_000) });
  return token;
}

export async function consumeAccountToken(token: string, purpose: AccountTokenPurpose) {
  if (!token || token.length > 200) return null;
  return AccountTokenModel.findOneAndUpdate(
    { tokenHash: accountTokenHash(token), purpose, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
}
