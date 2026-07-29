import { randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Wallet } from "../models/Wallet.js";
import { ApiError } from "../middleware/errorHandler.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
  signEmailChangeToken,
  verifyEmailChangeToken,
} from "../utils/jwt.js";
import { sha256Hex } from "../utils/hash.js";
import { sendVerificationEmail, sendPasswordResetEmail, sendEmailChangeEmail } from "./email.service.js";
import { checkPhoneOtp } from "./otp.service.js";
import { attachReferral } from "./affiliate.service.js";
import { env } from "../config/env.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(userId: string, role: string, permissions?: string[] | null): Promise<TokenPair> {
  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jti });

  await RefreshToken.create({
    _id: jti,
    userId,
    tokenHash: sha256Hex(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  const accessToken = signAccessToken({ sub: userId, role: role as never, permissions: permissions ?? undefined });
  return { accessToken, refreshToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: "customer" | "seller";
  referralCode?: string;
}) {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role === "seller" ? "seller" : "customer",
  });

  await Wallet.create({ userId: user._id, balance: 0 });
  // An unknown or inactive referral code is not an error — the account is still
  // created, it simply earns nobody a commission.
  await attachReferral(String(user._id), input.referralCode);

  const verifyToken = signEmailVerificationToken(String(user._id));
  await sendVerificationEmail(user.email, verifyToken);

  const tokens = await issueTokenPair(String(user._id), user.role);
  return { user, tokens };
}

// Called only from the trusted internal /auth/social bridge — the caller
// (Next.js server, after NextAuth already completed the OAuth handshake) is
// asserting this email/provider pairing is verified. Find-or-create by email;
// OAuth accounts are treated as pre-verified (the provider already confirmed it).
export async function socialLogin(input: {
  provider: "google" | "facebook";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}) {
  let user = await User.findOne({ email: input.email });

  if (!user) {
    user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(randomUUID()), // unusable random password; account only usable via OAuth or a reset
      role: "customer",
      provider: input.provider,
      providerId: input.providerId,
      avatarUrl: input.avatarUrl,
      emailVerifiedAt: new Date(),
    });
    await Wallet.create({ userId: user._id, balance: 0 });
  } else if (user.banned) {
    throw new ApiError(403, "This account has been suspended");
  }

  const tokens = await issueTokenPair(String(user._id), user.role, user.permissions);
  return { user, tokens };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.banned) throw new ApiError(403, "This account has been suspended");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const tokens = await issueTokenPair(String(user._id), user.role, user.permissions);
  return { user, tokens };
}

// Rotation: the presented refresh token is verified against its DB row, then
// immediately revoked and replaced — reuse of an already-rotated token is rejected.
export async function refreshSession(refreshToken: string): Promise<TokenPair> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const stored = await RefreshToken.findById(payload.jti);
  if (!stored || stored.revokedAt || stored.tokenHash !== sha256Hex(refreshToken) || stored.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token is no longer valid");
  }

  const user = await User.findById(stored.userId);
  if (!user || user.banned) throw new ApiError(401, "Account is not available");

  const next = await issueTokenPair(String(user._id), user.role, user.permissions);

  stored.revokedAt = new Date();
  stored.replacedByTokenHash = sha256Hex(next.refreshToken);
  await stored.save();

  return next;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await RefreshToken.updateOne({ _id: payload.jti }, { revokedAt: new Date() });
  } catch {
    // Already invalid/expired — nothing to revoke.
  }
}

export async function verifyEmail(token: string): Promise<void> {
  let payload;
  try {
    payload = verifyEmailVerificationToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired verification link");
  }
  await User.updateOne({ _id: payload.sub }, { emailVerifiedAt: new Date() });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email });
  // Silent no-op for unknown or already-verified addresses: responding
  // differently would turn this into an account-existence oracle.
  if (!user || user.emailVerifiedAt) return;
  await sendVerificationEmail(user.email, signEmailVerificationToken(String(user._id)));
}

/**
 * Email change, in two steps as the legacy app did: the new address must be
 * confirmed before it replaces the old one. The token carries both the user and
 * the pending address, so nothing is written until the link is followed — an
 * unconfirmed change can never lock someone out of their account.
 */
export async function requestEmailChange(userId: string, newEmail: string): Promise<void> {
  const normalised = newEmail.toLowerCase().trim();

  const existing = await User.findOne({ email: normalised });
  if (existing && String(existing._id) !== userId) {
    throw new ApiError(409, "That email address is already in use");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (user.email === normalised) throw new ApiError(400, "That is already your email address");

  const token = signEmailChangeToken(userId, normalised);
  await sendEmailChangeEmail(normalised, token);
}

export async function confirmEmailChange(token: string): Promise<{ email: string }> {
  let payload;
  try {
    payload = verifyEmailChangeToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired confirmation link");
  }

  // Re-checked at confirmation time: the address may have been claimed by
  // someone else between the request and the click.
  const taken = await User.findOne({ email: payload.email });
  if (taken && String(taken._id) !== payload.sub) {
    throw new ApiError(409, "That email address is already in use");
  }

  await User.updateOne({ _id: payload.sub }, { email: payload.email, emailVerifiedAt: new Date() });
  return { email: payload.email };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return; // do not reveal account existence
  const token = signPasswordResetToken(String(user._id));
  await sendPasswordResetEmail(user.email, token);
}

// --- Phone-based auth ----------------------------------------------------------

/**
 * Sign in with a phone number and an OTP, no password. The code is verified
 * against the provider before any token is issued, and an unknown number is
 * rejected the same way a wrong code is, so this cannot enumerate registered
 * phone numbers.
 */
export async function loginWithPhone(phone: string, code: string) {
  const verified = await checkPhoneOtp(phone, code);
  if (!verified) throw new ApiError(401, "That code is not valid");

  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(401, "That code is not valid");
  if (user.banned) throw new ApiError(403, "This account has been suspended");

  await User.updateOne({ _id: user._id }, { phoneVerifiedAt: new Date() });
  const tokens = await issueTokenPair(String(user._id), user.role, user.permissions);
  return { user, tokens };
}

/** Password reset over SMS, for accounts that registered by phone. */
export async function resetPasswordWithPhone(phone: string, code: string, newPassword: string): Promise<void> {
  const verified = await checkPhoneOtp(phone, code);
  if (!verified) throw new ApiError(401, "That code is not valid");

  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(401, "That code is not valid");

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  // Same as the email path: a reset invalidates every existing session.
  await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  let payload;
  try {
    payload = verifyPasswordResetToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired reset link");
  }
  const passwordHash = await hashPassword(newPassword);
  await User.updateOne({ _id: payload.sub }, { passwordHash });
  // Revoke all existing sessions so a leaked old token can't survive a reset.
  await RefreshToken.updateMany({ userId: payload.sub, revokedAt: null }, { revokedAt: new Date() });
}

export function verifyEmailRequired() {
  return env.NODE_ENV === "production";
}
