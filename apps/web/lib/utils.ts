import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extracts the server-sent error message from an Axios/API error, or returns a fallback. */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Converts free-form titles/names into URL-safe lowercase slugs. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
