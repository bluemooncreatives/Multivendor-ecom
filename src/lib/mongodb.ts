import "server-only";
import mongoose from "mongoose";

declare global {
  var __mongooseConnection: Promise<typeof mongoose> | undefined;
}

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

export class DatabaseUnavailableError extends Error {
  constructor(message = "MongoDB is unavailable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseUnavailableError("MONGODB_URI is not configured");
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!global.__mongooseConnection) {
    global.__mongooseConnection = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 3000),
      socketTimeoutMS: 20_000,
      family: 4,
      autoIndex: process.env.NODE_ENV !== "production",
    }).catch((error) => {
      global.__mongooseConnection = undefined;
      throw new DatabaseUnavailableError(error instanceof Error ? error.message : undefined);
    });
  }
  return global.__mongooseConnection;
}

export async function databaseHealthy(): Promise<boolean> {
  try {
    const connection = await connectMongo();
    await connection.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}

export function isMongoDuplicate(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}

export function objectId(value: string): mongoose.Types.ObjectId | null {
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
}
