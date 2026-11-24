import mongoose from "mongoose";
import { logger } from "../config/logger.js";
import { expireAbandonedOrders, RESERVATION_TTL_MINUTES } from "./payment.service.js";
import { unpublishExpiredSellerProducts } from "./package.service.js";

/**
 * Background maintenance.
 *
 * Two sweeps have to run on a timer rather than on a request:
 *
 *  - abandoned gateway checkouts hold stock (and flash-deal campaign allowance)
 *    that nothing else releases;
 *  - a lapsed seller subscription has to unpublish that seller's catalogue, which
 *    is what the legacy `SellerPackageController::unpublish_products` did when an
 *    operator or cron hit its route.
 *
 * Both are idempotent, so a double run is harmless. A lock is still taken so a
 * multi-instance deployment does the work once per interval instead of once per
 * instance: `findOneAndUpdate` on a single document is atomic, and the lock
 * carries an expiry so an instance that dies mid-sweep does not block the next
 * one forever.
 */

const jobLockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    lockedUntil: { type: Date, required: true },
    lastRunAt: { type: Date, default: null },
    lastResult: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

jobLockSchema.index({ lockedUntil: 1 });
export const JobLock = mongoose.model("JobLock", jobLockSchema);

/**
 * Runs `work` only if this process wins the lock for `name`. The lock is held for
 * `leaseMinutes`, which must exceed the work's worst-case duration.
 */
export async function withJobLock<T>(
  name: string,
  leaseMinutes: number,
  work: () => Promise<T>,
): Promise<T | null> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + leaseMinutes * 60_000);

  // Claims the lock when it is free or its lease has expired. `upsert` creates it
  // on the first run; the unique `_id` makes two simultaneous claims impossible.
  let claimed = false;
  try {
    const result = await JobLock.findOneAndUpdate(
      { _id: name, lockedUntil: { $lte: now } },
      { $set: { lockedUntil } },
      { new: true, upsert: true },
    );
    claimed = Boolean(result);
  } catch (error) {
    // A duplicate-key error means another instance created the lock first.
    if ((error as { code?: number }).code === 11000) return null;
    throw error;
  }
  if (!claimed) return null;

  try {
    const outcome = await work();
    await JobLock.updateOne({ _id: name }, { $set: { lastRunAt: new Date(), lastResult: outcome, lockedUntil: new Date(0) } });
    return outcome;
  } catch (error) {
    // Release the lock on failure so the next tick retries rather than waiting
    // out the whole lease.
    await JobLock.updateOne({ _id: name }, { $set: { lockedUntil: new Date(0) } });
    throw error;
  }
}

export interface MaintenanceOptions {
  /** How often to run, in minutes. */
  intervalMinutes?: number;
  /** How long a gateway checkout may hold stock before the sweep reclaims it. */
  reservationTtlMinutes?: number;
}

export async function runMaintenanceOnce(options: MaintenanceOptions = {}) {
  const ttl = options.reservationTtlMinutes ?? RESERVATION_TTL_MINUTES;

  const abandoned = await withJobLock("expire-abandoned-orders", 15, () => expireAbandonedOrders(ttl));
  if (abandoned && abandoned.expired > 0) {
    logger.info(`Released ${abandoned.expired} abandoned checkout(s) of ${abandoned.scanned} scanned`);
  }

  const lapsed = await withJobLock("unpublish-expired-sellers", 15, () => unpublishExpiredSellerProducts());
  if (lapsed && lapsed.unpublished > 0) {
    logger.info(`Unpublished ${lapsed.unpublished} listing(s) for ${lapsed.sellers} seller(s) with a lapsed package`);
  }

  return { abandoned, lapsed };
}

/**
 * Starts the timer. Returns a stop function so a test (or a shutdown handler) can
 * end it; the interval is unref'd so it never keeps the process alive on its own.
 */
export function startMaintenanceScheduler(options: MaintenanceOptions = {}) {
  const intervalMinutes = options.intervalMinutes ?? 15;
  let running = false;

  const tick = async () => {
    // Never overlap with itself: a slow sweep must not be re-entered.
    if (running) return;
    running = true;
    try {
      await runMaintenanceOnce(options);
    } catch (error) {
      logger.error(`Maintenance sweep failed: ${String(error)}`);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void tick(), intervalMinutes * 60_000);
  timer.unref?.();
  logger.info(`Maintenance scheduler started; every ${intervalMinutes} minute(s)`);

  return () => clearInterval(timer);
}
