"use client";

import { useLocale } from "next-intl";
import { useCurrencies } from "@/lib/hooks/useAdminCatalogExtras";
import { useCurrencyStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

// Mirrors the server's currency.service.ts conversion formula exactly (rateToBase
// = units of base/INR per 1 unit of that currency) so display-side conversion
// never drifts from how the backend would compute the same thing.
export function useDisplayCurrency() {
  const locale = useLocale();
  const { data: currencies } = useCurrencies();
  const code = useCurrencyStore((s) => s.code);
  const setCode = useCurrencyStore((s) => s.setCode);

  function convert(amount: number, fromCode: string): { amount: number; code: string } {
    if (!currencies || fromCode === code) return { amount, code: fromCode };
    const from = currencies.find((c) => c.code === fromCode);
    const to = currencies.find((c) => c.code === code);
    if (!from || !to) return { amount, code: fromCode };
    const amountInBase = amount * from.rateToBase;
    return { amount: Math.round((amountInBase / to.rateToBase) * 100) / 100, code: to.code };
  }

  function display(amount: number, fromCode: string): string {
    const converted = convert(amount, fromCode);
    return formatPrice(converted.amount, converted.code, locale);
  }

  return { code, setCode, currencies: currencies ?? [], convert, display };
}
