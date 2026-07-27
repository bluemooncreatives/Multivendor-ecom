export function asset(path?: string | null): string {
  if (!path) return "/frontend/images/placeholder.jpg";
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  return `/${normalized}`;
}

export function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function salePrice(price: number, discount = 0, type = "amount"): number {
  const result = type === "percent" ? price - price * (discount / 100) : price - discount;
  return Math.max(0, Math.round(result * 100) / 100);
}

export function money(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function titleFromSlug(value: string): string {
  return decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
