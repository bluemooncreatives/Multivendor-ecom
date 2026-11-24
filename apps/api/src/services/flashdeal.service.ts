import { Types, type ClientSession } from "mongoose";
import { FlashDeal } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Flash-deal pricing authority.
 *
 * The legacy app resolved a campaign price in five separate places (`Helpers.php`
 * home_price/home_discounted_base_price, `CartController@addToCart`,
 * `PosController@addToCart`, `HomeController`), each repeating the same rules:
 *
 *  - a campaign counts only while `status = 1` and today falls inside
 *    [start_date, end_date];
 *  - campaigns are scanned in insertion order and the **first** one holding the
 *    product wins (`break`);
 *  - a matched campaign discount **replaces** the product's own discount — the two
 *    never stack (`if (!$inFlashDeal) { ...product discount... }`);
 *  - the discount applies to the line's list price (variant price for a variant
 *    product, unit price otherwise) and tax is charged on the discounted price.
 *
 * Every price shown or charged in this application resolves through this module so
 * the campaign page, the cart, the coupon preview, POS and checkout cannot drift
 * apart. `dealStock` is a target-side campaign allowance the legacy schema had no
 * column for: null keeps the legacy "unlimited" behaviour, and a number is
 * consumed atomically at reservation time.
 */

export interface FlashDealMatch {
  dealId: string;
  slug: string;
  title: string;
  discount: number;
  discountType: "percent" | "flat";
  /** Null = unlimited campaign allowance (legacy behaviour). */
  dealStock: number | null;
  dealSold: number;
  /** Null when the allowance is unlimited. */
  remaining: number | null;
}

export interface PricedLineRef {
  productId: string;
  variantSku: string;
}

export interface DealStockLine {
  dealId: string;
  productId: string;
  variantSku: string;
  quantity: number;
}

/** Map key for a (product, variant) pair. */
export function dealKey(productId: string, variantSku: string): string {
  return `${productId}|${variantSku}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolves the campaign that prices each requested line, or no entry when none
 * does. Entries whose allowance is already exhausted are skipped, so the line
 * falls back to the product's own discount rather than being sold below the
 * campaign cap.
 */
export async function resolveFlashDeals(
  lines: PricedLineRef[],
  opts: { now?: Date; session?: ClientSession } = {},
): Promise<Map<string, FlashDealMatch>> {
  const matches = new Map<string, FlashDealMatch>();
  if (lines.length === 0) return matches;

  const wanted = new Set(lines.map((line) => dealKey(line.productId, line.variantSku)));
  const productIds = [...new Set(lines.map((line) => line.productId))]
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
  if (productIds.length === 0) return matches;

  const now = opts.now ?? new Date();
  // Insertion order, matching the legacy scan that stopped at the first campaign
  // holding the product. `_id` breaks ties for campaigns created in the same tick.
  const query = FlashDeal.find({
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    "products.productId": { $in: productIds },
  }).sort({ createdAt: 1, _id: 1 });
  if (opts.session) query.session(opts.session);
  const deals = await query.lean();

  for (const deal of deals) {
    for (const entry of deal.products ?? []) {
      const key = dealKey(String(entry.productId), entry.variantSku);
      if (!wanted.has(key) || matches.has(key)) continue;

      const dealStock = entry.dealStock ?? null;
      const dealSold = entry.dealSold ?? 0;
      const remaining = dealStock === null ? null : Math.max(0, dealStock - dealSold);
      if (remaining !== null && remaining <= 0) continue; // allowance spent

      matches.set(key, {
        dealId: String(deal._id),
        slug: deal.slug,
        title: deal.title,
        discount: entry.discount ?? 0,
        discountType: (entry.discountType ?? "percent") as "percent" | "flat",
        dealStock,
        dealSold,
        remaining,
      });
    }
  }

  return matches;
}

/** The campaign price for one unit, floored at zero like the legacy helpers. */
export function flashDealUnitPrice(listPrice: number, match: FlashDealMatch): number {
  const cut = match.discountType === "percent" ? (listPrice * match.discount) / 100 : match.discount;
  return Math.max(0, round2(listPrice - cut));
}

/** Effective percentage off, for badges and sorting. */
export function flashDealPercentOff(listPrice: number, match: FlashDealMatch): number {
  if (listPrice <= 0) return 0;
  return Math.round(((listPrice - flashDealUnitPrice(listPrice, match)) / listPrice) * 100);
}

/**
 * Consumes campaign allowance. Written as a pipeline update on the native
 * collection for the same reason as `reserveStock`: MongoDB rejects `$expr` inside
 * both `$elemMatch` queries and `arrayFilters`, so the "enough allowance left"
 * guard has to be evaluated inside a `$map`/`$cond` that only rewrites the entry
 * when it passes. `modifiedCount === 0` therefore means "allowance gone", with no
 * read-then-write race. Unlimited entries (`dealStock: null`) always pass and
 * still count their sales.
 */
export async function reserveDealStock(lines: DealStockLine[], session: ClientSession) {
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new ApiError(400, "Deal quantity must be a positive integer");
    }
    const productId = new Types.ObjectId(line.productId);
    const result = await FlashDeal.collection.updateOne(
      {
        _id: new Types.ObjectId(line.dealId),
        products: { $elemMatch: { productId, variantSku: line.variantSku } },
      },
      [
        {
          $set: {
            products: {
              $map: {
                input: "$products",
                as: "p",
                in: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$$p.productId", productId] },
                        { $eq: ["$$p.variantSku", line.variantSku] },
                        {
                          $or: [
                            { $eq: [{ $ifNull: ["$$p.dealStock", null] }, null] },
                            {
                              $gte: [
                                { $subtract: ["$$p.dealStock", { $ifNull: ["$$p.dealSold", 0] }] },
                                line.quantity,
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      $mergeObjects: [
                        "$$p",
                        { dealSold: { $add: [{ $ifNull: ["$$p.dealSold", 0] }, line.quantity] } },
                      ],
                    },
                    "$$p",
                  ],
                },
              },
            },
          },
        },
      ],
      { session },
    );

    if (result.matchedCount === 0 || result.modifiedCount === 0) {
      throw new ApiError(409, "This flash deal has just sold out; refresh your cart for the current price");
    }
  }
}

/**
 * Returns campaign allowance when an order that consumed it is cancelled or its
 * payment fails. Deliberately tolerant: a campaign the admin has since edited or
 * deleted must not be able to block a cancellation or a payment-failure unwind.
 */
export async function releaseDealStock(lines: DealStockLine[], session: ClientSession) {
  for (const line of lines) {
    if (!Types.ObjectId.isValid(line.dealId) || line.quantity <= 0) continue;
    await FlashDeal.updateOne(
      {
        _id: line.dealId,
        products: {
          $elemMatch: { productId: line.productId, variantSku: line.variantSku, dealSold: { $gte: line.quantity } },
        },
      },
      { $inc: { "products.$[p].dealSold": -line.quantity } },
      {
        session,
        arrayFilters: [{ "p.productId": new Types.ObjectId(line.productId), "p.variantSku": line.variantSku }],
      },
    );
  }
}

/** Campaign lines held by an order, for the cancel / payment-failure unwind. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function dealLinesFromOrder(order: { details: any[] }): DealStockLine[] {
  return order.details.flatMap((detail) =>
    (detail.items ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.flashDealId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        dealId: String(item.flashDealId),
        productId: String(item.productId),
        variantSku: item.variantSku,
        quantity: item.quantity,
      })),
  );
}
