"use client";

import { useLocale } from "next-intl";
import { useCurrencies } from "@/lib/hooks/useAdminCatalogExtras";
import { useCurrencyStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { useSiteSettings } from "@/lib/site-settings-context";

// Mirrors the server's currency.service.ts conversion formula exactly (rateToBase
// = units of base/INR per 1 unit of that currency) so display-side conversion
// never drifts from how the backend would compute the same thing.
export function useDisplayCurrency() {
  const locale = useLocale();
  const { general } = useSiteSettings();
  const { data: currencies } = useCurrencies();
  const code = useCurrencyStore((s) => s.code);
  const setCode = useCurrencyStore((s) => s.setCode);

  function convert(amount: number, fromCode: string): { amount: number; code: string } {
    if (!currencies || fromCode === code) return { amount, code: fromCode };
    const from = currencies.find((c) => c.code === fromCode);
    const to = currencies.find((c) => c.code === code);
    if (!from || !to || !Number.isFinite(from.rateToBase) || from.rateToBase <= 0 ||
        !Number.isFinite(to.rateToBase) || to.rateToBase <= 0) return { amount, code: fromCode };
    const amountInBase = amount * from.rateToBase;
    const precision = 10 ** (to.decimals ?? 2);
    return { amount: Math.round((amountInBase / to.rateToBase) * precision) / precision, code: to.code };
  }

  // `fromCode` is optional because several records (classifieds, packages) leave
  // currency unset and are priced in the store's base currency.
  function display(amount: number, fromCode?: string): string {
    const converted = convert(amount, fromCode ?? general.defaultCurrency ?? "INR");
    const currency = currencies?.find((item) => item.code === converted.code);
    if (!currency) return formatPrice(converted.amount, converted.code, locale);
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: currency.decimals ?? 2, maximumFractionDigits: currency.decimals ?? 2,
    }).format(converted.amount);
    return currency.symbolPosition === "after" ? `${number} ${currency.symbol}` : `${currency.symbol}${number}`;
  }

  return { code, setCode, currencies: currencies ?? [], convert, display };
}
