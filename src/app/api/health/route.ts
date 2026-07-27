import { NextResponse } from "next/server";
import { databaseHealthy, mongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  const database = await databaseHealthy();
  return NextResponse.json({
    status: database ? "ok" : "degraded",
    framework: "Next.js",
    backend: "Node.js/Express",
    database: database ? "mongodb:connected" : mongoConfigured() ? "mongodb:unreachable" : "mongodb:not-configured",
    catalogFallback: !database && (process.env.ALLOW_DEMO_DATA === "true" || process.env.NODE_ENV !== "production"),
    timestamp: new Date().toISOString(),
  }, { status: database || process.env.NODE_ENV !== "production" ? 200 : 503 });
}
