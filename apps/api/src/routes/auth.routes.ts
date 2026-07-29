import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  registerHandler,
  loginHandler,
  socialLoginHandler,
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
  socialLoginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  sendPublicOtpHandler,
  phoneLoginHandler,
  phoneLoginSchema,
  phonePasswordResetHandler,
  phonePasswordResetSchema,
  resendVerificationHandler,
  resendVerificationSchema,
  requestEmailChangeHandler,
  requestEmailChangeSchema,
  confirmEmailChangeHandler,
  confirmEmailChangeSchema,
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { requireInternalSecret } from "../middleware/internal.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

// Tighter limit on credential/OTP endpoints specifically, on top of the global limiter.
const authLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

authRouter.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post("/social", requireInternalSecret, validateBody(socialLoginSchema), asyncHandler(socialLoginHandler));
authRouter.post("/refresh", authLimiter, validateBody(refreshSchema), asyncHandler(refreshHandler));
authRouter.post("/logout", validateBody(refreshSchema), asyncHandler(logoutHandler));
authRouter.post("/verify-email", validateBody(verifyEmailSchema), asyncHandler(verifyEmailHandler));
authRouter.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), asyncHandler(forgotPasswordHandler));
authRouter.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), asyncHandler(resetPasswordHandler));
authRouter.get("/me", authenticate, asyncHandler(meHandler));
// Verifying the phone number on an existing account.
authRouter.post("/otp/send", authenticate, authLimiter, validateBody(sendOtpSchema), asyncHandler(sendPhoneOtpHandler));
authRouter.post("/otp/verify", authenticate, authLimiter, validateBody(verifyOtpSchema), asyncHandler(verifyPhoneOtpHandler));

// Signing in by phone and resetting a password over SMS both happen while signed
// out, so these are deliberately unauthenticated — rate-limited rather than gated.
authRouter.post("/phone/otp", authLimiter, validateBody(sendOtpSchema), asyncHandler(sendPublicOtpHandler));
authRouter.post("/phone/login", authLimiter, validateBody(phoneLoginSchema), asyncHandler(phoneLoginHandler));
authRouter.post(
  "/phone/reset-password",
  authLimiter,
  validateBody(phonePasswordResetSchema),
  asyncHandler(phonePasswordResetHandler),
);

authRouter.post(
  "/resend-verification",
  authLimiter,
  validateBody(resendVerificationSchema),
  asyncHandler(resendVerificationHandler),
);
authRouter.post(
  "/email-change",
  authenticate,
  authLimiter,
  validateBody(requestEmailChangeSchema),
  asyncHandler(requestEmailChangeHandler),
);
// Confirmation is unauthenticated: the emailed token is the proof, and the user
// may follow the link in a browser where they are not signed in.
authRouter.post("/email-change/confirm", validateBody(confirmEmailChangeSchema), asyncHandler(confirmEmailChangeHandler));
