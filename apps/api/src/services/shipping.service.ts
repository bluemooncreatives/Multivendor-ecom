import type mongoose from "mongoose";
import { Shop } from "../models/Shop.js";

export interface ShippableLine {
  /** Null for admin-owned ("In House") products. */
  sellerId: string | null;
  quantity: number;
  /** From the product: "free" means this line never adds shipping. */
  shippingType: "free" | "flat_rate";
  shippingCost: number;
}

export interface ShippingSettings {
  mode: "flat" | "product_wise" | "seller_wise" | "free";
  flatShippingCost: number;
  adminShippingCost: number;
  minOrderForFreeShipping: number | null;
}

/** Sellers (or the admin bucket) the shopper chose to collect from in person. */
export type PickupSelection = Set<string>;

export const ADMIN_BUCKET = "__admin__";

export function sellerKey(sellerId: string | null): string {
  return sellerId ?? ADMIN_BUCKET;
}

/**
 * Shipping cost per seller bucket, mirroring the legacy getShippingCost() modes:
 *
 * - `free`         nothing is charged.
 * - `flat`         one store-wide charge, split evenly across the buckets that ship.
 * - `product_wise` each line contributes its own product's cost x quantity.
 * - `seller_wise`  each seller charges once from their shop; admin-owned items
 *                  use the store's adminShippingCost.
 *
 * Buckets the shopper is collecting in person are charged nothing, and are also
 * excluded from the flat-rate split so the remaining buckets do not absorb their
 * share (the legacy version divided by the whole cart and silently overcharged).
 */
export async function calculateShipping(
  lines: ShippableLine[],
  settings: ShippingSettings,
  pickup: PickupSelection = new Set(),
  orderSubtotal = 0,
  session?: mongoose.ClientSession,
): Promise<Map<string, number>> {
  const costs = new Map<string, number>();
  const buckets = [...new Set(lines.map((l) => sellerKey(l.sellerId)))];
  for (const bucket of buckets) costs.set(bucket, 0);

  const freeThresholdMet =
    settings.minOrderForFreeShipping !== null && orderSubtotal >= settings.minOrderForFreeShipping;

  if (settings.mode === "free" || freeThresholdMet) return costs;

  // Buckets that actually ship — pickup buckets are excluded everywhere below.
  const shipping = buckets.filter((b) => !pickup.has(b));
  if (shipping.length === 0) return costs;

  if (settings.mode === "flat") {
    const share = Math.round((settings.flatShippingCost / shipping.length) * 100) / 100;
    for (const bucket of shipping) costs.set(bucket, share);
    return costs;
  }

  if (settings.mode === "product_wise") {
    for (const line of lines) {
      const bucket = sellerKey(line.sellerId);
      if (pickup.has(bucket) || line.shippingType === "free") continue;
      costs.set(bucket, round2((costs.get(bucket) ?? 0) + line.shippingCost * line.quantity));
    }
    return costs;
  }

  // seller_wise: one charge per seller, read from their shop.
  const sellerIds = shipping.filter((b) => b !== ADMIN_BUCKET);
  const shops = await Shop.find({ sellerId: { $in: sellerIds } }, { sellerId: 1, shippingCost: 1 })
    .session(session ?? null)
    .lean();
  const costBySeller = new Map(shops.map((s) => [String(s.sellerId), s.shippingCost ?? 0]));

  for (const bucket of shipping) {
    costs.set(bucket, bucket === ADMIN_BUCKET ? settings.adminShippingCost : (costBySeller.get(bucket) ?? 0));
  }
  return costs;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Per-unit price after the product's own discount, and the tax that price attracts.
 * Legacy applied both at line level; the rewrite had collapsed them into one global
 * tax percentage applied to the whole order.
 */
export function priceLine(input: {
  unitPrice: number;
  quantity: number;
  discount: number;
  discountType: "flat" | "percent";
  /** Null falls back to the store-wide rate. */
  tax: number | null;
  taxType: "flat" | "percent";
  storeTaxPercent: number;
}): { unitPrice: number; lineSubtotal: number; lineTax: number } {
  const discountPerUnit =
    input.discountType === "percent" ? (input.unitPrice * input.discount) / 100 : input.discount;

  // Never let a misconfigured discount drive the price below zero.
  const unitPrice = Math.max(0, round2(input.unitPrice - discountPerUnit));
  const lineSubtotal = round2(unitPrice * input.quantity);

  const lineTax =
    input.tax === null
      ? round2((lineSubtotal * input.storeTaxPercent) / 100)
      : input.taxType === "percent"
        ? round2((lineSubtotal * input.tax) / 100)
        : round2(input.tax * input.quantity);

  return { unitPrice, lineSubtotal, lineTax };
}
