import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  meHandler,
  sendPhoneOtpHandler,
  verifyPhoneOtpHandler,
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

// Tighter limit on credential/OTP endpoints specifically, on top of the global limiter.
const authLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

authRouter.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post("/refresh", authLimiter, validateBody(refreshSchema), asyncHandler(refreshHandler));
authRouter.post("/logout", validateBody(refreshSchema), asyncHandler(logoutHandler));
authRouter.post("/verify-email", validateBody(verifyEmailSchema), asyncHandler(verifyEmailHandler));
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), asyncHandler(forgotPasswordHandler));
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), asyncHandler(resetPasswordHandler));
authRouter.get("/me", authenticate, asyncHandler(meHandler));
authRouter.post("/otp/send", authenticate, authLimiter, validateBody(sendOtpSchema), asyncHandler(sendPhoneOtpHandler));
authRouter.post("/otp/verify", authenticate, authLimiter, validateBody(verifyOtpSchema), asyncHandler(verifyPhoneOtpHandler));
