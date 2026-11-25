import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { obsoleteAuthIndexes } from "./auth-indexes.js";

let connected = false;

export async function connectDb(): Promise<typeof mongoose> {
  if (connected) return mongoose;

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
  });
  try {
    // Financial replay guards and phone ownership rely on unique indexes. Do
    // not accept traffic while they are still building, or after a duplicate
    // historical row caused index creation to fail.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    const users = mongoose.models.User?.collection;
    if (users) {
      const obsolete = obsoleteAuthIndexes(await users.indexes());
      if (obsolete.length) throw new Error(`Auth index upgrade required (${obsolete.join(", ")}). Stop API traffic and run migrate:auth-indexes; review its dry-run report before applying.`);
    }
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }

  connected = true;
  logger.info(`MongoDB connected: ${env.MONGODB_DB}`);

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB connection error", err);
  });

  return mongoose;
}

export async function disconnectDb(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
