import { Currency } from "../models/Localization.js";

// All prices are authored and charged in their product's/order's own currency
// (Product.currency, Order.currency) — conversion here is for *display* only,
// e.g. showing an INR-priced catalog to a shopper browsing in USD.
export async function convertAmount(amount: number, fromCode: string, toCode: string): Promise<number> {
  if (fromCode === toCode) return amount;

  const [from, to] = await Promise.all([
    Currency.findOne({ code: fromCode, active: true }),
    Currency.findOne({ code: toCode, active: true }),
  ]);
  if (!from || !to) return amount; // unknown currency — fail closed to the original amount

  // rateToBase = how many base-currency (INR) units one unit of this currency is worth.
  const amountInBase = amount * from.rateToBase;
  return Math.round((amountInBase / to.rateToBase) * 100) / 100;
}

export async function listActiveCurrencies() {
  return Currency.find({ active: true }).sort({ code: 1 });
}
