import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import * as otpService from "../services/otp.service.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["customer", "seller"]).optional(),
  referralCode: z.string().trim().min(1).max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const socialLoginSchema = z.object({
  provider: z.enum(["google", "facebook", "twitter"]),
  providerId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(6),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(4).max(10),
});

export const resendVerificationSchema = z.object({ email: z.string().email() });

export const requestEmailChangeSchema = z.object({ email: z.string().email() });
export const confirmEmailChangeSchema = z.object({ token: z.string().min(1) });

export const phoneLoginSchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(4).max(10),
});

export const phonePasswordResetSchema = z.object({
  phone: z.string().min(6),
  code: z.string().min(4).max(10),
  password: z.string().min(8).max(72),
});

function toAuthResponse(user: { _id: unknown }, tokens: { accessToken: string; refreshToken: string }) {
  return { userId: String(user._id), ...tokens };
}

export async function registerHandler(req: Request, res: Response) {
  const { user, tokens } = await authService.register(req.body);
  res.status(201).json(toAuthResponse(user, tokens));
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);
  res.json(toAuthResponse(user, tokens));
}

export async function socialLoginHandler(req: Request, res: Response) {
  const { user, tokens } = await authService.socialLogin(req.body);
  res.json(toAuthResponse(user, tokens));
}

export async function refreshHandler(req: Request, res: Response) {
  const tokens = await authService.refreshSession(req.body.refreshToken);
  res.json(tokens);
}

export async function logoutHandler(req: Request, res: Response) {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
}

export async function verifyEmailHandler(req: Request, res: Response) {
  await authService.verifyEmail(req.body.token);
  res.status(204).send();
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.requestPasswordReset(req.body.email);
  res.status(204).send();
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json(user);
}

export async function sendPhoneOtpHandler(req: Request, res: Response) {
  await otpService.sendPhoneOtp(req.body.phone);
  res.status(204).send();
}

export async function verifyPhoneOtpHandler(req: Request, res: Response) {
  const ok = await otpService.checkPhoneOtp(req.body.phone, req.body.code);
  if (!ok) throw new ApiError(400, "Incorrect or expired code");
  await User.updateOne({ _id: req.user!.id, phone: req.body.phone }, { phoneVerifiedAt: new Date() });
  res.status(204).send();
}

// --- Unauthenticated OTP flows ---------------------------------------------------
// These sit outside `authenticate`: signing in by phone and resetting a password
// over SMS are both things you do precisely because you are not signed in.

export async function sendPublicOtpHandler(req: Request, res: Response) {
  // Always 204, whether or not the number is registered — a different response
  // for unknown numbers would let anyone test which phones have accounts.
  await otpService.sendPhoneOtp(req.body.phone);
  res.status(204).send();
}

export async function phoneLoginHandler(req: Request, res: Response) {
  const { user, tokens } = await authService.loginWithPhone(req.body.phone, req.body.code);
  res.json(toAuthResponse(user, tokens));
}

export async function phonePasswordResetHandler(req: Request, res: Response) {
  await authService.resetPasswordWithPhone(req.body.phone, req.body.code, req.body.password);
  res.status(204).send();
}

// --- Email verification & change ---------------------------------------------------

export async function resendVerificationHandler(req: Request, res: Response) {
  await authService.resendVerificationEmail(req.body.email);
  res.status(204).send();
}

export async function requestEmailChangeHandler(req: Request, res: Response) {
  await authService.requestEmailChange(req.user!.id, req.body.email);
  res.status(202).json({ message: "Check your new inbox for a confirmation link" });
}

export async function confirmEmailChangeHandler(req: Request, res: Response) {
  res.json(await authService.confirmEmailChange(req.body.token));
}
