import type { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Server-side fetch for metadata generation. Returns null instead of throwing:
 * a metadata failure must never take down the page it describes, and Next would
 * surface a rejected generateMetadata as a route-level error.
 */
export async function fetchForMetadata<T>(path: string, revalidateSeconds = 300): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate: revalidateSeconds } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export interface SeoInput {
  title: string;
  description?: string | null;
  image?: string | null;
  /** Locale-prefixed path, e.g. "/en/product/blue-shirt". */
  path: string;
  locale: string;
  type?: "website" | "article" | "product";
  keywords?: string[];
  noIndex?: boolean;
}

/**
 * One place that builds title/description/canonical/OpenGraph/Twitter tags, so
 * every route describes itself the same way. Descriptions are trimmed to 160
 * characters — search results truncate beyond that anyway.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const description = input.description?.replace(/\s+/g, " ").trim().slice(0, 160) || undefined;
  const url = `${SITE_URL}${input.path}`;
  const images = input.image ? [{ url: input.image }] : undefined;

  return {
    title: input.title,
    description,
    keywords: input.keywords?.length ? input.keywords : undefined,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description,
      url,
      type: input.type === "product" ? "website" : (input.type ?? "website"),
      locale: input.locale,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

/** Metadata for a route whose subject could not be loaded or does not exist. */
export function notFoundMetadata(title = "Not found"): Metadata {
  return { title, robots: { index: false, follow: false } };
}
