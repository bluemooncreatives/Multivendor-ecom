import type { MetadataRoute } from "next";
import { locales } from "@/i18n";
import { fetchForMetadata } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Cap per collection. A sitemap file may hold 50,000 URLs, and these are
// multiplied by the locale count — past this the catalog needs a sitemap index
// rather than one file.
const MAX_PER_COLLECTION = 5_000;

interface Entry {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified?: string;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: Entry[] = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/products", changeFrequency: "daily", priority: 0.9 },
    { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
    { path: "/brands", changeFrequency: "weekly", priority: 0.7 },
    { path: "/classifieds", changeFrequency: "daily", priority: 0.7 },
    { path: "/customer-packages", changeFrequency: "monthly", priority: 0.4 },
    { path: "/track-order", changeFrequency: "monthly", priority: 0.4 },
    { path: "/become-seller", changeFrequency: "monthly", priority: 0.5 },
    { path: "/login", changeFrequency: "yearly", priority: 0.3 },
    { path: "/register", changeFrequency: "yearly", priority: 0.3 },
    ...(["privacy", "terms", "return", "seller", "support"] as const).map((policy) => ({
      path: `/policies/${policy}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  // Each collection is fetched independently and degrades to nothing if the API
  // is unavailable, so a partial outage yields a smaller sitemap rather than a
  // failed build.
  const [products, categories, pages] = await Promise.all([
    fetchForMetadata<{ items: { slug: string; updatedAt?: string }[] }>("/catalog/products?pageSize=60&sort=newest", 3600),
    fetchForMetadata<{ items: { slug: string; updatedAt?: string }[] }>("/catalog/categories", 3600),
    fetchForMetadata<{ items: { slug: string; updatedAt?: string }[] }>("/cms/pages", 3600),
  ]);

  const dynamicEntries: Entry[] = [
    ...(products?.items ?? []).slice(0, MAX_PER_COLLECTION).map((p) => ({
      path: `/product/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: p.updatedAt,
    })),
    ...(categories?.items ?? []).slice(0, MAX_PER_COLLECTION).map((c) => ({
      path: `/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      lastModified: c.updatedAt,
    })),
    ...(pages?.items ?? []).slice(0, MAX_PER_COLLECTION).map((p) => ({
      path: `/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      lastModified: p.updatedAt,
    })),
  ];

  return locales.flatMap((locale) =>
    [...staticEntries, ...dynamicEntries].map((entry) => ({
      url: `${BASE}/${locale}${entry.path}`,
      lastModified: entry.lastModified ? new Date(entry.lastModified) : new Date(),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
  );
}
