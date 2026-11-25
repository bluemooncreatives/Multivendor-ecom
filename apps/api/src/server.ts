import mongoose from "mongoose";
import { createApp } from "./app.js";
import { startMaintenanceScheduler } from "./services/scheduler.service.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function main() {
  await connectDb();
  const app = createApp();

  // Started after the database is up, and only in the server entry point: the
  // test harness and the migration CLI build the app without a scheduler.
  const stopScheduler = env.RUN_MAINTENANCE_JOBS
    ? startMaintenanceScheduler({
        intervalMinutes: env.MAINTENANCE_INTERVAL_MINUTES,
        reservationTtlMinutes: env.RESERVATION_TTL_MINUTES,
      })
    : null;

  const server = app.listen(env.API_PORT, () => logger.info(`API listening on http://localhost:${env.API_PORT}`));

  // Stop accepting work, finish what is in flight, then let the process exit.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received; shutting down`);
    stopScheduler?.();
    const deadline = setTimeout(() => {
      server.closeAllConnections();
      void mongoose.disconnect().finally(() => process.exit(1));
    }, 30_000);
    deadline.unref();
    server.close(() => {
      clearTimeout(deadline);
      void mongoose.disconnect().finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error("Failed to start API server", error);
  process.exitCode = 1;
});
