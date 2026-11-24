import { randomBytes } from "node:crypto";

/**
 * Legacy slug shape: `strtolower(str_replace(' ', '-', $title) . '-' . Str::random(5))`.
 * Punctuation is dropped as well (the legacy version left it in, producing URLs
 * that had to be escaped), and a random suffix keeps the slug unique without a
 * read-modify-write race against the unique index.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function uniqueSlug(title: string, length = 5): string {
  const base = slugify(title);
  const suffix = randomBytes(8).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, length);
  return base ? `${base}-${suffix}` : suffix;
}
