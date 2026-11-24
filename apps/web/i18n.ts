import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { mergeTranslationOverrides } from "./lib/translations";

export const locales = ["en", "hi", "ar"] as const;
export type Locale = (typeof locales)[number];
export const rtlLocales: Locale[] = ["ar"];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const baseline = (await import(`./messages/${locale}.json`)).default;
  let overrides: Record<string, unknown> = {};
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/localization/translations/${locale}`, {
      next: { revalidate: 60 }, signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && !Array.isArray(body)) overrides = body as Record<string, unknown>;
    }
  } catch {
    // Shipped messages keep builds and the storefront usable during API downtime.
  }
  return {
    locale,
    messages: mergeTranslationOverrides(baseline, overrides),
  };
});
