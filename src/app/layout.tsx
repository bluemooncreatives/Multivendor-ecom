import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "@/app/globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PreferencesProvider, type CurrencyPreference, type LanguagePreference } from "@/components/preferences-provider";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { CurrencyModel, LanguageModel, SettingModel } from "@/models";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "V4Local — Vocal for Local", template: "%s | V4Local" },
  description: "Discover products from local shops, independent sellers, and home businesses across India.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  const cookieStore = await cookies();
  let googleAnalytics = false; let facebookPixel = false; let classifiedEnabled = false;
  let currencies: CurrencyPreference[] = [{ code: "Rupee", name: "Indian Rupee", symbol: "₹", exchangeRate: 68.45 }];
  let languages: LanguagePreference[] = [{ code: "en", name: "English", rtl: false }];
  let initialCurrency = currencies[0]; let baseCurrency = currencies[0]; let initialLanguage = languages[0]; let translations: Record<string, string> = {};
  try {
    await connectMongo();
    const [settingRows, currencyRows, languageRows] = await Promise.all([
      SettingModel.find({ key: { $in: ["business.google_analytics", "business.facebook_pixel", "business.classified_product", "business.system_default_currency"] } }).select("key value").lean(),
      CurrencyModel.find({ active: true }).select("legacyId name symbol code exchangeRate").sort({ legacyId: 1 }).lean(),
      LanguageModel.find({ active: true }).select("name code rtl translations").sort({ legacyId: 1 }).lean(),
    ]);
    const settings = Object.fromEntries(settingRows.map((setting) => [setting.key, setting.value]));
    googleAnalytics = (settings["business.google_analytics"] === true || String(settings["business.google_analytics"]) === "1") && Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);
    facebookPixel = (settings["business.facebook_pixel"] === true || String(settings["business.facebook_pixel"]) === "1") && Boolean(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
    classifiedEnabled = settings["business.classified_product"] === true || String(settings["business.classified_product"]) === "1";
    if (currencyRows.length) currencies = currencyRows.map((row) => ({ code: row.code, name: row.name, symbol: row.symbol, exchangeRate: row.exchangeRate }));
    if (languageRows.length) languages = languageRows.map((row) => ({ code: row.code, name: row.name, rtl: row.rtl }));
    const defaultCurrencyRow = currencyRows.find((row) => String(row.legacyId) === String(settings["business.system_default_currency"]));
    baseCurrency = defaultCurrencyRow ? { code: defaultCurrencyRow.code, name: defaultCurrencyRow.name, symbol: defaultCurrencyRow.symbol, exchangeRate: defaultCurrencyRow.exchangeRate } : currencies[0];
    initialCurrency = currencies.find((currency) => currency.code === cookieStore.get("v4_currency")?.value) || baseCurrency;
    initialLanguage = languages.find((language) => language.code === cookieStore.get("v4_locale")?.value) || languages.find((language) => language.code === (process.env.DEFAULT_LANGUAGE || "en")) || languages[0];
    const languageDocument = languageRows.find((language) => language.code === initialLanguage.code);
    translations = (languageDocument?.translations || {}) as Record<string, string>;
  } catch {}
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "";
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "";
  return <html lang={initialLanguage.code} dir={initialLanguage.rtl ? "rtl" : "ltr"}><body><PreferencesProvider initialCurrency={initialCurrency} baseCurrency={baseCurrency} currencies={currencies} initialLanguage={initialLanguage} languages={languages} translations={translations}><CartProvider><Header user={user} classifiedEnabled={classifiedEnabled}/>{children}<Footer/></CartProvider></PreferencesProvider>{googleAnalytics && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{__html:`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}}/></>}{facebookPixel && <Script id="facebook-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{__html:`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}}/>}</body></html>;
}
