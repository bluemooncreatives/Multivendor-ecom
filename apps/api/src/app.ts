import cors from "cors";
import path from "node:path";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { stripeWebhookHandler, razorpayWebhookHandler, paypalWebhookHandler } from "./controllers/webhook.controller.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import { publicUploadsRoot, legacyUploadsRoot } from "./config/storage.js";
import { sendPublicS3File } from "./services/s3-storage.service.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    }),
  );

  // Webhook routes read the raw request body (required for signature verification)
  // and MUST be registered before the global express.json() body parser below.
  app.post("/api/v1/payments/webhooks/stripe", express.raw({ type: "application/json" }), asyncHandler(stripeWebhookHandler));
  app.post("/api/v1/payments/webhooks/razorpay", express.raw({ type: "application/json" }), asyncHandler(razorpayWebhookHandler));
  app.post("/api/v1/payments/webhooks/paypal", express.raw({ type: "application/json" }), asyncHandler(paypalWebhookHandler));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: env.API_RATE_LIMIT_PER_MINUTE ?? 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Locally-stored uploads (UPLOAD_DRIVER=local). Served read-only with
  // execution disabled: `index: false` stops directory listing, and the
  // Content-Disposition/nosniff pair means a file that slipped past the upload
  // allow-list is downloaded rather than executed or rendered inline. Digital
  // goods are never written here — they go behind the signed download route.
  app.get("/uploads/s3/:bucket/:kind/:ownerId/:filename", asyncHandler(async (req, res) => {
    await sendPublicS3File(String(req.params.bucket), `${req.params.kind}/${req.params.ownerId}/${req.params.filename}`, res);
  }));

  app.use(
    "/uploads",
    (req, res, next) => {
      let normalized: string;
      try { normalized = path.posix.normalize(decodeURIComponent(req.path).replace(/\\/g, "/")).toLowerCase(); }
      catch { res.sendStatus(400); return; }
      if (normalized === "/digital" || normalized.startsWith("/digital/")) { res.sendStatus(404); return; }
      next();
    },
    express.static(publicUploadsRoot, {
      index: false,
      dotfiles: "deny",
      maxAge: "7d",
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      },
    }),
  );

  app.use("/uploads", express.static(legacyUploadsRoot, { index: false, dotfiles: "deny" }));

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
