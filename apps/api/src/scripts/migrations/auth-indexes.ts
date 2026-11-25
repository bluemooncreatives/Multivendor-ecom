import type { Connection } from "mongoose";
import { AUTH_INDEXES, obsoleteAuthIndexes } from "../../config/auth-indexes.js";

type Database = NonNullable<Connection["db"]>;
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}

/** Read-only by default. Apply only with API traffic stopped and a backup taken. */
export async function migrateAuthIndexes(db: Database, apply = false) {
  const users = db.collection("users");
  const existing = await users.indexes().catch((error: { code?: number }) => { if (error.code === 26) return []; throw error; });
  async function duplicates(field: "email" | "phone") {
    const rows = await users.aggregate<{ ids: unknown[]; count: number }>([
      { $match: { [field]: { $type: "string" }, ...(field === "phone" ? { phoneVerifiedAt: { $type: "date" } } : {}) } },
      { $project: { key: field === "email" ? { $toLower: { $trim: { input: `$${field}` } } } : { $trim: { input: `$${field}` } } } },
      { $match: { key: { $ne: "" } } },
      { $group: { _id: "$key", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $project: { _id: 0, ids: 1, count: 1 } },
    ]).toArray();
    return rows.map((row) => ({ ids: row.ids.map(String), count: row.count }));
  }
  const duplicateEmails = await duplicates("email");
  const duplicateVerifiedPhones = await duplicates("phone");
  const conflicts: string[] = [];
  for (const expected of AUTH_INDEXES) {
    const current = existing.find((index) => index.name === expected.options.name);
    if (current && (stable(current.key) !== stable(expected.key) || !current.unique ||
      stable(current.partialFilterExpression) !== stable(expected.options.partialFilterExpression) || current.collation)) {
      conflicts.push(expected.options.name);
    }
  }
  const report = { dryRun: !apply, applied: false, users: await users.countDocuments(), duplicateEmails, duplicateVerifiedPhones, conflicts,
    createIndexes: AUTH_INDEXES.filter((expected) => !existing.some((index) => index.name === expected.options.name)).map((index) => index.options.name),
    dropIndexes: obsoleteAuthIndexes(existing), normalizedEmails: 0, normalizedPhones: 0,
  };
  if (!apply || duplicateEmails.length || duplicateVerifiedPhones.length || conflicts.length) return report;

  // Install replacement guards before removing the known obsolete constraints.
  // A non-sparse unique email_1 would permit only one account without an email.
  for (const index of AUTH_INDEXES) await users.createIndex(index.key, index.options);
  for (const name of report.dropIndexes) await users.dropIndex(name);
  report.normalizedEmails += (await users.updateMany({ email: { $type: "string" } }, [{ $set: { email: { $toLower: { $trim: { input: "$email" } } } } }])).modifiedCount;
  report.normalizedEmails += (await users.updateMany({ email: { $in: ["", null] } }, { $unset: { email: "" } })).modifiedCount;
  report.normalizedPhones += (await users.updateMany({ phone: { $type: "string" } }, [{ $set: { phone: { $trim: { input: "$phone" } } } }])).modifiedCount;
  report.normalizedPhones += (await users.updateMany({ phone: { $in: ["", null] } }, { $unset: { phone: "", phoneVerifiedAt: "" } })).modifiedCount;
  report.applied = true;
  return report;
}
