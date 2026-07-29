import type { NextFunction, Request, Response } from "express";
import { BusinessSetting } from "../models/Settings.js";
import { ApiError } from "./errorHandler.js";

// Paths a demo visitor must still be able to POST to, or they could not sign in,
// browse as a user, or leave. Everything else that mutates state is refused.
const ALLOWED_PREFIXES = ["/auth/", "/cart", "/catalog/products", "/coupons/validate", "/newsletter/subscribe"];

let cached: { value: boolean; expiresAt: number } | null = null;

// The flag is read on every mutating request, so it is cached briefly rather than
// hitting the settings collection each time.
async function isDemoMode(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const settings = await BusinessSetting.findOne({ key: "business" }).select("demoMode");
  cached = { value: settings?.demoMode ?? false, expiresAt: Date.now() + 30_000 };
  return cached.value;
}

// Called by the settings updater so toggling demo mode takes effect immediately
// instead of after the cache window.
export function invalidateDemoModeCache() {
  cached = null;
}

// Blocks writes on a public demo deployment. The legacy app shipped this as
// per-controller `if (env('DEMO_MODE'))` checks that were missing from roughly
// half the destructive endpoints; enforcing it once here closes those holes.
export function demoModeGuard(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  if (ALLOWED_PREFIXES.some((prefix) => req.path.startsWith(prefix))) return next();

  isDemoMode()
    .then((enabled) => {
      if (enabled) {
        return next(new ApiError(403, "This is a read-only demo — changes cannot be saved", "DEMO_MODE"));
      }
      next();
    })
    .catch(next);
}
