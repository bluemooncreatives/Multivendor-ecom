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
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
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
function toAuthResponse(user, tokens) {
    return { userId: String(user._id), ...tokens };
}
export async function registerHandler(req, res) {
    const { user, tokens } = await authService.register(req.body);
    res.status(201).json(toAuthResponse(user, tokens));
}
export async function loginHandler(req, res) {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password);
    res.json(toAuthResponse(user, tokens));
}
export async function refreshHandler(req, res) {
    const tokens = await authService.refreshSession(req.body.refreshToken);
    res.json(tokens);
}
export async function logoutHandler(req, res) {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
}
export async function verifyEmailHandler(req, res) {
    await authService.verifyEmail(req.body.token);
    res.status(204).send();
}
export async function forgotPasswordHandler(req, res) {
    await authService.requestPasswordReset(req.body.email);
    res.status(204).send();
}
export async function resetPasswordHandler(req, res) {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(204).send();
}
export async function meHandler(req, res) {
    const user = await User.findById(req.user.id);
    if (!user)
        throw new ApiError(404, "User not found");
    res.json(user);
}
export async function sendPhoneOtpHandler(req, res) {
    await otpService.sendPhoneOtp(req.body.phone);
    res.status(204).send();
}
export async function verifyPhoneOtpHandler(req, res) {
    const ok = await otpService.checkPhoneOtp(req.body.phone, req.body.code);
    if (!ok)
        throw new ApiError(400, "Incorrect or expired code");
    await User.updateOne({ _id: req.user.id, phone: req.body.phone }, { phoneVerifiedAt: new Date() });
    res.status(204).send();
}
//# sourceMappingURL=auth.controller.js.map