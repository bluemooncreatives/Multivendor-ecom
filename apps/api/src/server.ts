import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.API_PORT, () => logger.info(`API listening on http://localhost:${env.API_PORT}`));
}

main().catch((error) => {
  logger.error("Failed to start API server", error);
  process.exitCode = 1;
});
