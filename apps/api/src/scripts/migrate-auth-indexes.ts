import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import mongoose from "mongoose";
import { migrateAuthIndexes } from "./migrations/auth-indexes.js";

async function main() {
  const { values } = parseArgs({ options: { yes: { type: "boolean", default: false }, report: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    console.log("migrate-auth-indexes [--report <path>] [--yes]\nDefault: read-only duplicate/index report. Stop API traffic and back up the database before applying with --yes.");
    return;
  }
  const { env } = await import("../config/env.js");
  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB, autoIndex: false });
    const report = await migrateAuthIndexes(mongoose.connection.db!, values.yes);
    const json = JSON.stringify(report, null, 2) + "\n";
    if (values.report) await writeFile(values.report, json, "utf8");
    console.log(json);
    if (values.yes && !report.applied) process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Auth index migration failed"); process.exitCode = 1; });
