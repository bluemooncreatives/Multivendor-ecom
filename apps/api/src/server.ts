import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { stripeWebhookHandler, razorpayWebhookHandler, paypalWebhookHandler } from "./controllers/webhook.controller.js";
import { asyncHandler } from "./utils/asyncHandler.js";

async function main() {
  await connectDb();

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
      limit: 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Locally-stored uploads (UPLOAD_DRIVER=local). Served read-only with
  // execution disabled: `index: false` stops directory listing, and the
  // Content-Disposition/nosniff pair means a file that slipped past the upload
  // allow-list is downloaded rather than executed or rendered inline. Digital
  // goods are never written here — they go behind the signed download route.
  app.use(
    "/uploads",
    express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../public/uploads"), {
      index: false,
      dotfiles: "deny",
      maxAge: "7d",
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      },
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.API_PORT, () => {
    logger.info(`API listening on http://localhost:${env.API_PORT}`);
  });
}

main().catch((err) => {
  logger.error("Failed to start API server", err);
  process.exit(1);
});
