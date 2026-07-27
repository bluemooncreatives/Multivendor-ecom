"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type CurrencyPreference = { code: string; name: string; symbol: string; exchangeRate: number };
export type LanguagePreference = { code: string; name: string; rtl: boolean };

type Preferences = {
  currency: CurrencyPreference;
  currencies: CurrencyPreference[];
  language: LanguagePreference;
  languages: LanguagePreference[];
  formatMoney: (value: number) => string;
  translate: (key: string) => string;
  changeCurrency: (code: string) => Promise<void>;
  changeLanguage: (code: string) => Promise<void>;
  busy: boolean;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children, initialCurrency, baseCurrency, currencies, initialLanguage, languages, translations }: {
  children: React.ReactNode;
  initialCurrency: CurrencyPreference;
  baseCurrency: CurrencyPreference;
  currencies: CurrencyPreference[];
  initialLanguage: LanguagePreference;
  languages: LanguagePreference[];
  translations: Record<string, string>;
}) {
  const [busy, setBusy] = useState(false);
  const value = useMemo<Preferences>(() => ({
    currency: initialCurrency,
    currencies,
    language: initialLanguage,
    languages,
    busy,
    formatMoney(amount) {
      const converted = (Number(amount) || 0) / baseCurrency.exchangeRate * initialCurrency.exchangeRate;
      const isoCode = initialCurrency.code.toUpperCase() === "RUPEE" ? "INR" : initialCurrency.code.toUpperCase();
      try {
        return new Intl.NumberFormat(initialLanguage.code === "en" ? "en-IN" : initialLanguage.code, { style: "currency", currency: isoCode, maximumFractionDigits: 2 }).format(converted);
      } catch {
        return `${initialCurrency.symbol}${converted.toFixed(2)}`;
      }
    },
    translate(key) { const translated = translations[key]; return typeof translated === "string" && translated.trim() ? translated : key; },
    async changeCurrency(code) { await updatePreference({ currency: code }, setBusy); },
    async changeLanguage(code) { await updatePreference({ language: code }, setBusy); },
  }), [baseCurrency.exchangeRate, busy, currencies, initialCurrency, initialLanguage, languages, translations]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

async function updatePreference(body: { currency?: string; language?: string }, setBusy: (value: boolean) => void) {
  setBusy(true);
  try {
    const response = await fetch("/api/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error("Could not update preference");
    window.location.reload();
  } finally { setBusy(false); }
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}

export function Money({ value }: { value: number }) {
  const preferences = usePreferences();
  return <>{preferences.formatMoney(value)}</>;
}
