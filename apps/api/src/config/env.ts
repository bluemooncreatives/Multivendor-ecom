import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

// Single shared .env lives at the monorepo root (apps/web reads it via
// NEXT_PUBLIC_* at build time; apps/api needs it explicitly since its cwd is
// apps/api when run standalone, not the workspace root).
const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../../../.env") });

const envBoolean = z.preprocess((value) => {
  if (typeof value === "string") {
    if (["true", "1"].includes(value.toLowerCase())) return true;
    if (["false", "0", ""].includes(value.toLowerCase())) return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(10000).default(180),
  // Publicly reachable base URL of THIS API server (not the web app) — used to
  // build gateway callback/webhook URLs, which must point back at the API, never
  // at the Next.js origin.
  API_PUBLIC_URL: z.string().default("http://localhost:4000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().default("v4local_marketplace"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  EMAIL_VERIFY_SECRET: z.string().min(16),
  // Shared secret for the web app's NextAuth server-side callback to call
  // POST /auth/social — this endpoint must never be reachable with a client-
  // forged email, so it's gated behind a header only the trusted Next.js
  // server (never the browser) holds.
  INTERNAL_API_SECRET: z.string().min(16),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  DEFAULT_CURRENCY: z.string().default("INR"),
  DEFAULT_LANGUAGE: z.string().default("en"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: envBoolean.default(false),
  MAIL_FROM: z.string().optional(),
  MAIL_FROM_NAME: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOAD_DRIVER: z.enum(["local", "cloudinary", "s3"]).default("local"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.union([z.literal(""), z.string().url()]).optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_REGION: z.string().optional(),

  // Encrypts provider credentials that admins enter through the settings UI
  // (SMTP password, S3 keys, social secrets, gateway keys) before they are
  // written to MongoDB. Changing it makes every stored secret unreadable, so it
  // must be treated as permanent for a given deployment.
  SETTINGS_ENCRYPTION_KEY: z.string().min(32).optional(),

  // Background maintenance: releases stock held by abandoned gateway checkouts
  // and unpublishes the catalogue of sellers whose package has lapsed. Both
  // sweeps are also exposed as admin endpoints, so a deployment that runs them
  // from an external scheduler can leave this off.
  RUN_MAINTENANCE_JOBS: envBoolean.default(true),
  MAINTENANCE_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  // How long a gateway checkout may hold stock before the sweep reclaims it.
  RESERVATION_TTL_MINUTES: z.coerce.number().int().min(5).max(10080).default(60),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. Check .env against .env.example.");
}

export const env = parsed.data;
