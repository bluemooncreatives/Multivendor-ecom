import type { MetadataRoute } from "next";
import { locales } from "@/i18n";

// Product/category detail URLs are intentionally left out of the static map —
// they're numerous and change frequently; a production build should generate
// those from the catalog API (e.g. in a cron-refreshed route) rather than here.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticPaths = ["", "/products", "/categories", "/login", "/register"];

  return locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.7,
    })),
  );
}
