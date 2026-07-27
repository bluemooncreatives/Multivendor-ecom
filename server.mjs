import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import next from "next";

const dev = process.argv.includes("--dev");
process.env.NODE_ENV = dev ? "development" : "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
await mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_DB || undefined,
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
  serverSelectionTimeoutMS: 10_000,
});

const server = express();
server.disable("x-powered-by");
server.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
server.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
server.use(compression());
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});
server.use("/api/auth", authLimiter);
server.use("/api/v1/auth", authLimiter);
server.use("/api", rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.API_RATE_LIMIT || 180),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (request) => request.path === "/health",
}));

server.get("/healthz", async (_request, response) => {
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  response.status(database === "connected" || dev ? 200 : 503).json({
    status: database === "connected" ? "ok" : "degraded",
    runtime: "node",
    framework: "express-next",
    database: `mongodb:${database}`,
    uptime: Math.round(process.uptime()),
  });
});

server.use((request, response) => handle(request, response));

const listener = server.listen(port, hostname, () => {
  console.log(`V4Local ready on http://${hostname}:${port} (${dev ? "development" : "production"})`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully.`);
  listener.close(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      process.exit(0);
    }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
