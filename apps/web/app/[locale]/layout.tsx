import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, rtlLocales, type Locale } from "@/i18n";
import { AppProviders } from "@/lib/providers";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { getSiteSettings } from "@/lib/site-settings.server";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import { publicAssetUrl } from "@/lib/site-settings";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { general, seo } = await getSiteSettings();
  const image = publicAssetUrl(seo.metaImageUrl);
  const favicon = publicAssetUrl(general.faviconUrl);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: seo.metaTitle || general.appName,
    description: seo.metaDescription || "Multivendor marketplace",
    keywords: seo.metaKeywords,
    authors: seo.author ? [{ name: seo.author }] : undefined,
    icons: favicon ? { icon: favicon } : undefined,
    openGraph: { title: seo.metaTitle || general.appName, description: seo.metaDescription, images: image ? [image] : undefined },
  };
}

// Even a build made while the API is unavailable must later pick up language
// overrides. A failed fetch alone does not establish a cached revalidation time.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();
  const settings = await getSiteSettings();
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <SiteSettingsProvider value={settings}>
          <AppProviders>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </AppProviders>
          </SiteSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
