import { resolveFlashDeals, flashDealUnitPrice, dealKey, type FlashDealMatch } from "./flashdeal.service.js";

/**
 * Catalog display pricing.
 *
 * The legacy storefront never printed a raw `unit_price`: every product card and
 * detail page went through `home_discounted_base_price()` / `homePrice()`, which
 * applied the live flash-deal discount or, failing that, the product's own. The
 * rewrite's cards showed the variant price and `comparePrice` instead, so a product
 * carrying a 20% discount advertised a price nobody was ever charged.
 *
 * `pricing` is computed here, from the same resolver checkout uses, and attached to
 * every storefront product payload. Tax is deliberately excluded: this application
 * shows tax as its own line in the cart, checkout and invoice, where the legacy
 * blade templates folded it into the displayed price.
 */

export interface VariantPricing {
  sku: string;
  listPrice: number;
  price: number;
}

export interface ProductPricing {
  /** Cheapest variant's pre-discount price — what gets struck through. */
  listPrice: number;
  /** Cheapest variant's price after the applicable discount. */
  price: number;
  /** Highest variant price after discount, for "₹100 – ₹150" ranges. */
  maxPrice: number;
  discountPercent: number;
  discountSource: "flash_deal" | "product" | "none";
  flashDealId: string | null;
  flashDealSlug: string | null;
  flashDealTitle: string | null;
  variants: VariantPricing[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function productUnitPrice(listPrice: number, discount: number, discountType: string): number {
  const cut = discountType === "percent" ? (listPrice * discount) / 100 : discount;
  return Math.max(0, round2(listPrice - cut));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductLike = any;

/**
 * Attaches `pricing` to each product. One campaign query covers the whole page, so
 * a 24-product grid costs a single extra round-trip rather than one per card (the
 * legacy helpers re-queried every campaign for every product on every page).
 */
export async function decorateProductsPricing(products: ProductLike[]): Promise<ProductLike[]> {
  if (products.length === 0) return [];

  const lines: { productId: string; variantSku: string }[] = [];
  for (const product of products) {
    for (const variant of product.variants ?? []) {
      lines.push({ productId: String(product._id ?? product.id), variantSku: variant.sku });
    }
  }
  const deals = await resolveFlashDeals(lines);

  return products.map((product) => {
    const plain = typeof product.toJSON === "function" ? product.toJSON() : { ...product };
    plain.pricing = computePricing(product, deals);
    return plain;
  });
}

export async function decorateProductPricing(product: ProductLike): Promise<ProductLike> {
  const [decorated] = await decorateProductsPricing([product]);
  return decorated;
}

export function computePricing(product: ProductLike, deals: Map<string, FlashDealMatch>): ProductPricing {
  const productId = String(product._id ?? product.id);
  const discount = product.discount ?? 0;
  const discountType = product.discountType ?? "percent";

  let match: FlashDealMatch | null = null;
  const variants: VariantPricing[] = (product.variants ?? []).map((variant: ProductLike) => {
    const listPrice = variant.price ?? 0;
    const deal = deals.get(dealKey(productId, variant.sku)) ?? null;
    if (deal && !match) match = deal;
    return {
      sku: variant.sku,
      listPrice,
      price: deal ? flashDealUnitPrice(listPrice, deal) : productUnitPrice(listPrice, discount, discountType),
    };
  });

  // No variants should be impossible (the schema requires one), but a legacy import
  // could still produce one; fall back to the base price rather than returning NaN.
  if (variants.length === 0) {
    const listPrice = product.basePrice ?? 0;
    variants.push({ sku: "", listPrice, price: productUnitPrice(listPrice, discount, discountType) });
  }

  // Cheapest *effective* price leads the card, as in the legacy low-to-high helper.
  const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
  const maxPrice = variants.reduce((max, variant) => Math.max(max, variant.price), 0);
  const percentOff =
    cheapest.listPrice > 0 ? Math.round(((cheapest.listPrice - cheapest.price) / cheapest.listPrice) * 100) : 0;

  const resolved = match as FlashDealMatch | null;
  return {
    listPrice: cheapest.listPrice,
    price: cheapest.price,
    maxPrice,
    discountPercent: percentOff,
    discountSource: resolved ? "flash_deal" : percentOff > 0 ? "product" : "none",
    flashDealId: resolved?.dealId ?? null,
    flashDealSlug: resolved?.slug ?? null,
    flashDealTitle: resolved?.title ?? null,
    variants,
  };
}
