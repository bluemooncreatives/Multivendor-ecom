/**
 * Minimal mysqldump reader.
 *
 * The legacy application ships its database as a `mysqldump` file
 * (`software_ecommercemvendor22.sql`). Reading that file directly - rather than
 * requiring a live MySQL server and a driver dependency - means the import can be
 * run anywhere the dump is, including from a backup, and can be rehearsed against
 * a scratch database before touching anything real.
 *
 * Only what a dump actually contains is supported: `INSERT INTO x (cols) VALUES
 * (...),(...);` and `CREATE TABLE` (for column order when an INSERT omits the
 * column list). Values are decoded with MySQL's own escaping rules; a malformed
 * statement throws rather than silently yielding a short row, because a migration
 * that quietly drops a column is worse than one that stops.
 */

export type SqlValue = string | number | null;
export type Row = Record<string, SqlValue>;

export interface ParsedDump {
  tables: Map<string, Row[]>;
  /** Column order declared by CREATE TABLE, used when an INSERT omits columns. */
  columns: Map<string, string[]>;
}

const BACKTICK_NAME = "`([^`]+)`";

/** Decodes one single-quoted MySQL string literal starting at `start` (the quote). */
function readString(text: string, start: number): { value: string; next: number } {
  let i = start + 1;
  let out = "";
  while (i < text.length) {
    const char = text[i]!;
    if (char === "\\") {
      const escaped = text[i + 1];
      i += 2;
      switch (escaped) {
        case "n": out += "\n"; break;
        case "r": out += "\r"; break;
        case "t": out += "\t"; break;
        case "0": out += "\0"; break;
        case "b": out += "\b"; break;
        case "Z": out += "\u001a"; break;
        case undefined: throw new Error("Unterminated escape in SQL string literal");
        default: out += escaped; // \' \" \\ \% \_ and anything else: the literal char
      }
      continue;
    }
    if (char === "'") {
      // '' inside a quoted string is an escaped quote.
      if (text[i + 1] === "'") { out += "'"; i += 2; continue; }
      return { value: out, next: i + 1 };
    }
    out += char;
    i += 1;
  }
  throw new Error("Unterminated SQL string literal");
}

/** Splits one `(...)` value tuple, honouring quotes, escapes and nested parens. */
function readTuple(text: string, start: number): { values: SqlValue[]; next: number } {
  let i = start + 1; // skip "("
  const values: SqlValue[] = [];
  let token = "";
  let tokenIsString = false;
  let depth = 0;

  const pushToken = () => {
    if (tokenIsString) { values.push(token); } else {
      const trimmed = token.trim();
      if (trimmed === "" ) { values.push(null); }
      else if (/^NULL$/i.test(trimmed)) { values.push(null); }
      else if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) { values.push(Number(trimmed)); }
      else if (/^0x[0-9a-fA-F]+$/.test(trimmed)) { values.push(trimmed); }
      else { values.push(trimmed); } // keywords such as CURRENT_TIMESTAMP
    }
    token = "";
    tokenIsString = false;
  };

  while (i < text.length) {
    const char = text[i]!;
    if (char === "'") {
      // Whitespace between the separator and the opening quote is layout, not part
      // of the value: ", 'a'" must decode as "a", never " a".
      if (token.trim() === "") token = "";
      const { value, next } = readString(text, i);
      token += value;
      tokenIsString = true;
      i = next;
      continue;
    }
    if (char === "(") { depth += 1; token += char; i += 1; continue; }
    if (char === ")") {
      if (depth > 0) { depth -= 1; token += char; i += 1; continue; }
      pushToken();
      return { values, next: i + 1 };
    }
    if (char === "," && depth === 0) { pushToken(); i += 1; continue; }
    token += char;
    i += 1;
  }
  throw new Error("Unterminated SQL value tuple");
}

export function parseDump(sql: string): ParsedDump {
  const tables = new Map<string, Row[]>();
  const columns = new Map<string, string[]>();

  // Column order per table, for INSERTs that omit the column list.
  const createRe = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?${BACKTICK_NAME} \\(([\\s\\S]*?)\\n\\) ENGINE`, "g");
  for (let m = createRe.exec(sql); m; m = createRe.exec(sql)) {
    const cols = [...m[2]!.matchAll(/^\s*`([^`]+)`\s+\w/gm)].map((c) => c[1]!);
    columns.set(m[1]!, cols);
  }

  const insertRe = new RegExp(`INSERT(?: IGNORE)?(?: LOW_PRIORITY)? INTO ${BACKTICK_NAME}\\s*(\\(([^)]*)\\))?\\s*VALUES`, "g");
  for (let m = insertRe.exec(sql); m; m = insertRe.exec(sql)) {
    const table = m[1]!;
    const declared = m[3] ? [...m[3].matchAll(/`([^`]+)`/g)].map((c) => c[1]!) : columns.get(table);
    if (!declared || declared.length === 0) {
      throw new Error(`INSERT INTO ${table} has no column list and no CREATE TABLE to take one from`);
    }

    const rows = tables.get(table) ?? [];
    let i = insertRe.lastIndex;
    // Tuples run until the statement's terminating semicolon.
    for (;;) {
      while (i < sql.length && /[\s,]/.test(sql[i]!)) i += 1;
      if (sql[i] !== "(") break;
      const { values, next } = readTuple(sql, i);
      if (values.length !== declared.length) {
        throw new Error(
          `INSERT INTO ${table}: row has ${values.length} values for ${declared.length} columns`,
        );
      }
      rows.push(Object.fromEntries(declared.map((col, index) => [col, values[index]!])) as Row);
      i = next;
      while (i < sql.length && /\s/.test(sql[i]!)) i += 1;
      if (sql[i] === ";") { i += 1; break; }
      if (sql[i] !== ",") break;
    }
    tables.set(table, rows);
    insertRe.lastIndex = i;
  }

  return { tables, columns };
}

// --- Value helpers -------------------------------------------------------------

export function str(value: SqlValue | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

export function num(value: SqlValue | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function bool(value: SqlValue | undefined): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim().toLowerCase();
  return text === "1" || text === "true";
}

/** MySQL DATETIME / unix seconds / NULL -> Date | null. A zero date is null. */
export function date(value: SqlValue | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (value <= 0) return null;
    // Unix seconds (flash_deals.start_date) rather than milliseconds.
    return new Date(value * 1000);
  }
  const text = String(value).trim();
  if (!text || text.startsWith("0000-00-00")) return null;
  // "YYYY-MM-DD HH:MM:SS" is read as UTC; the legacy app stored server-local
  // timestamps, so an operator importing from another zone must pass --tz-offset.
  const parsed = new Date(text.replace(" ", "T") + (/[zZ+]/.test(text) ? "" : "Z"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Legacy JSON columns (`products.photos`, `shops.sliders`, …) hold either a JSON
 * array, a comma-separated id list, or a single value. Anything unparseable comes
 * back as an empty array rather than throwing: these columns are decorative, and
 * one bad row must not abort an import.
 */
export function jsonArray(value: SqlValue | undefined): unknown[] {
  const text = str(value);
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return text.split(",").map((part) => part.trim()).filter(Boolean);
}

export function jsonObject(value: SqlValue | undefined): Record<string, unknown> | null {
  const text = str(value);
  if (!text || !text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Legacy upload paths are stored relative to `public/`; serve them from /uploads. */
export function uploadUrl(value: SqlValue | undefined, publicBase = ""): string | null {
  const text = str(value);
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  const clean = text.replace(/^\/+/, "");
  return `${publicBase}/${clean}`.replace(/\/{2,}/g, "/");
}
