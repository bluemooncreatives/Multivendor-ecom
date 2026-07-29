import Papa from "papaparse";
import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../middleware/errorHandler.js";

interface CsvRow {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

export interface CustomerImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors importProductsCsv: one bad row is reported and skipped rather than
// failing the whole upload, so an admin can fix just the offending lines.
export async function importCustomersCsv(csvBuffer: Buffer): Promise<CustomerImportResult> {
  const parsed = Papa.parse<CsvRow>(csvBuffer.toString("utf8"), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new ApiError(400, `CSV parse error: ${parsed.errors[0]!.message}`);
  }

  const result: CustomerImportResult = { created: 0, skipped: [] };
  // Duplicates *within the file* would otherwise slip past the per-row DB lookup,
  // because none of them are committed until their own iteration runs.
  const seenEmails = new Set<string>();

  for (const [index, row] of parsed.data.entries()) {
    const rowNumber = index + 2; // +1 for 0-index, +1 for the header row
    const email = row.email?.trim().toLowerCase();

    if (!row.name?.trim() || !email) {
      result.skipped.push({ row: rowNumber, reason: "name and email are required" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      result.skipped.push({ row: rowNumber, reason: "Invalid email address" });
      continue;
    }
    if (seenEmails.has(email)) {
      result.skipped.push({ row: rowNumber, reason: "Duplicate email within this file" });
      continue;
    }
    if (row.password && row.password.length < 8) {
      result.skipped.push({ row: rowNumber, reason: "Password must be at least 8 characters" });
      continue;
    }
    if (await User.exists({ email })) {
      result.skipped.push({ row: rowNumber, reason: "An account with this email already exists" });
      continue;
    }

    try {
      // No password column means the account can only be entered via the
      // password-reset flow — never via a shared or guessable default.
      const password = row.password ?? crypto.randomUUID();
      const user = await User.create({
        name: row.name.trim(),
        email,
        phone: row.phone?.trim() || undefined,
        passwordHash: await hashPassword(password),
        role: "customer",
      });
      await Wallet.create({ userId: user._id, balance: 0 });

      seenEmails.add(email);
      result.created += 1;
    } catch (err) {
      result.skipped.push({ row: rowNumber, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return result;
}
