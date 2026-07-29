import type { NextFunction, Request, Response } from "express";
import { BusinessSetting } from "../models/Settings.js";
import { ApiError } from "./errorHandler.js";

// Staff must still be able to sign in and use the admin area while the storefront
// is down — otherwise turning maintenance mode on would lock the operator out of
// the setting that turns it off again.
const ALWAYS_ALLOWED = ["/auth/", "/admin", "/health"];

let cached: { value: boolean; expiresAt: number } | null = null;

async function isMaintenanceMode(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const settings = await BusinessSetting.findOne({ key: "business" }).select("activation");
  cached = { value: settings?.activation?.maintenanceMode ?? false, expiresAt: Date.now() + 30_000 };
  return cached.value;
}

export function invalidateMaintenanceCache() {
  cached = null;
}

/**
 * Takes the storefront offline for shoppers while leaving staff a way in.
 * Enforced at the API rather than only hiding the UI, so a maintenance window
 * actually stops orders being placed.
 */
export function maintenanceGuard(req: Request, _res: Response, next: NextFunction) {
  if (ALWAYS_ALLOWED.some((prefix) => req.path.startsWith(prefix))) return next();

  isMaintenanceMode()
    .then((enabled) => {
      if (!enabled) return next();
      if (req.user && ["admin", "staff"].includes(req.user.role)) return next();
      next(new ApiError(503, "The store is temporarily down for maintenance", "MAINTENANCE_MODE"));
    })
    .catch(next);
}
