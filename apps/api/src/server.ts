import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";

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
