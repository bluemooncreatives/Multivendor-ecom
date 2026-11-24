import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { importLegacyDump, type ImportReport } from "./legacy/import.js";

/**
 * Legacy data migration CLI.
 *
 *   npm run migrate:legacy -- --dump ../legacy/software_ecommercemvendor22.sql --dry-run
 *   npm run migrate:legacy -- --dump ./dump.sql --uploads-base /legacy --report ./report.json
 *
 * Flags:
 *   --dump <file>        mysqldump of the legacy database (required)
 *   --dry-run            read and map everything, write nothing
 *   --only a,b,c         import only these legacy tables (for rehearsing one table)
 *   --uploads-base <url> prefix for legacy upload paths, e.g. /legacy or a CDN origin
 *   --tz-offset <mins>   shift legacy timestamps, when the dump was taken elsewhere
 *   --report <file>      write the full JSON report here as well as summarising it
 *   --yes                required to write; without it the run is forced to dry-run
 *
 * The import never deletes anything and is safe to re-run: each legacy row is
 * matched to the document it created last time. Always rehearse with --dry-run,
 * and take a database backup before the first real run.
 */

interface Args {
  dump?: string;
  dryRun: boolean;
  only?: string[];
  uploadsBase?: string;
  tzOffset?: number;
  report?: string;
  confirmed: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, confirmed: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case "--dump": args.dump = value; i += 1; break;
      case "--dry-run": args.dryRun = true; break;
      case "--only": args.only = (value ?? "").split(",").map((part) => part.trim()).filter(Boolean); i += 1; break;
      case "--uploads-base": args.uploadsBase = value; i += 1; break;
      case "--tz-offset": args.tzOffset = Number(value); i += 1; break;
      case "--report": args.report = value; i += 1; break;
      case "--yes": args.confirmed = true; break;
      default:
        if (flag?.startsWith("--")) throw new Error(`Unknown flag ${flag}`);
    }
  }
  return args;
}

function summarise(report: ImportReport): string {
  const lines: string[] = [];
  lines.push(report.dryRun ? "DRY RUN - nothing was written" : "Import complete");
  lines.push("");
  lines.push("table                      rows  created  updated  skipped");
  for (const table of report.tables) {
    const skipped = table.skipped.reduce((sum, entry) => sum + entry.count, 0);
    lines.push(
      `${table.table.padEnd(25)} ${String(table.rows).padStart(5)} ${String(table.created).padStart(8)} ${String(table.updated).padStart(8)} ${String(skipped).padStart(8)}`,
    );
  }

  const skips = report.tables.flatMap((table) => table.skipped.map((entry) => ({ table: table.table, ...entry })));
  if (skips.length > 0) {
    lines.push("");
    lines.push("Skipped rows:");
    for (const skip of skips) {
      lines.push(`  ${skip.table}: ${skip.count} x ${skip.reason} (e.g. ${skip.examples.join(", ")})`);
    }
  }

  const carried = report.notImported.filter((entry) => entry.rows > 0);
  if (carried.length > 0) {
    lines.push("");
    lines.push("Tables deliberately not imported as their own collection:");
    for (const entry of carried) lines.push(`  ${entry.table} (${entry.rows} row(s)): ${entry.reason}`);
  }

  if (report.unmappedSettings.length > 0) {
    lines.push("");
    lines.push("Legacy settings with no equivalent here (set them up in Admin > Settings):");
    lines.push(`  ${report.unmappedSettings.join(", ")}`);
  }

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of report.warnings) lines.push(`  - ${warning}`);
  }

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dump) throw new Error("Pass --dump <path to the legacy mysqldump>");

  const sql = await fs.readFile(path.resolve(args.dump), "utf8");

  // Writing requires an explicit --yes: a migration run by accident against a live
  // database is exactly the mistake this flag exists to prevent.
  const dryRun = args.dryRun || !args.confirmed;
  if (dryRun && !args.dryRun) {
    console.log("No --yes flag: running as a dry run. Re-run with --yes to write.\n");
  }

  await connectDb();
  try {
    const report = await importLegacyDump({
      sql,
      dryRun,
      only: args.only,
      uploadsBaseUrl: args.uploadsBase,
      tzOffsetMinutes: args.tzOffset,
      log: (message) => console.log(`  ${message}`),
    });

    console.log("");
    console.log(summarise(report));

    if (args.report) {
      await fs.writeFile(path.resolve(args.report), JSON.stringify(report, null, 2), "utf8");
      console.log(`\nFull report written to ${path.resolve(args.report)}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
