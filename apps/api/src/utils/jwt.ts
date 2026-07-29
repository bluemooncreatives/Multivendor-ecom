import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "@ecommercemultivendor/types";

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  permissions?: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // matches RefreshToken._id, so the DB row can be looked up/rotated
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function signEmailVerificationToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "verify-email" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "6h" });
}

export function verifyEmailVerificationToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.EMAIL_VERIFY_SECRET) as { sub: string; purpose: string };
  if (decoded.purpose !== "verify-email") throw new Error("Invalid token purpose");
  return decoded;
}

/**
 * Carries the pending address as well as the user, so nothing is written to the
 * account until the link is followed — an unconfirmed change cannot lock someone
 * out of their own login.
 */
export function signEmailChangeToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, purpose: "change-email" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "6h" });
}

export function verifyEmailChangeToken(token: string): { sub: string; email: string } {
  const decoded = jwt.verify(token, env.EMAIL_VERIFY_SECRET) as { sub: string; email: string; purpose: string };
  if (decoded.purpose !== "change-email") throw new Error("Invalid token purpose");
  return decoded;
}

export function signPasswordResetToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "reset-password" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "1h" });
}

export function verifyPasswordResetToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, env.EMAIL_VERIFY_SECRET) as { sub: string; purpose: string };
  if (decoded.purpose !== "reset-password") throw new Error("Invalid token purpose");
  return decoded;
}
