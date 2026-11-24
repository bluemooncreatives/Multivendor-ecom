import type { Request, Response } from "express";
import { z } from "zod";
import { FlashDeal, Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";
import { flashDealUnitPrice, flashDealPercentOff, type FlashDealMatch } from "../services/flashdeal.service.js";
import { slugify, uniqueSlug } from "../utils/slug.js";

// A campaign line discounts either a percentage or a fixed amount off the variant's
// list price (legacy flash_deal_products.discount / discount_type). `discountPercent`
// is still accepted as an alias so already-deployed admin clients keep working.
const dealProductSchema = z
  .object({
    productId: z.string(),
    variantSku: z.string(),
    discountType: z.enum(["percent", "flat"]).optional(),
    discount: z.number().min(0).optional(),
    discountPercent: z.number().min(0).max(90).optional(),
    /** Null/absent means an unlimited campaign allowance, as in the legacy app. */
    dealStock: z.number().int().min(0).nullable().optional(),
  })
  .transform((entry) => {
    const discountType = entry.discountType ?? "percent";
    const discount = entry.discount ?? entry.discountPercent;
    return { ...entry, discountType, discount };
  })
  .refine((entry) => entry.discount !== undefined, { message: "A discount is required for every campaign product" })
  .refine((entry) => entry.discountType !== "percent" || (entry.discount ?? 0) <= 90, {
    message: "A percentage campaign discount cannot exceed 90%",
  });

const flashDealBase = z.object({
    title: z.string().min(1),
    // Optional: the legacy controller derived the slug from the title and never
    // asked the admin for one, so a create without it must not be rejected.
    slug: z.string().min(1).max(140).optional(),
    bannerUrl: z.string().url().optional(),
    textColor: z.string().max(32).nullish(),
    backgroundColor: z.string().max(32).nullish(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  products: z.array(dealProductSchema).min(1),
});

// A campaign that ends before it starts would never be live, and silently
// accepting it is how the legacy admin produced "deals" nobody could buy.
const endsAfterStart = (deal: { startsAt?: Date; endsAt?: Date }) =>
  !deal.startsAt || !deal.endsAt || deal.endsAt > deal.startsAt;
const noDuplicateLines = (deal: { products?: { productId: string; variantSku: string }[] }) =>
  !deal.products ||
  new Set(deal.products.map((entry) => `${entry.productId}|${entry.variantSku}`)).size === deal.products.length;

export const flashDealSchema = flashDealBase
  .refine(endsAfterStart, { message: "The campaign must end after it starts" })
  .refine(noDuplicateLines, { message: "The same product variant cannot appear twice in one campaign" });

// PATCH sends only the fields being changed, so the same rules are applied to a
// partial body (a lone `endsAt` is checked against the stored `startsAt` below).
export const flashDealPatchSchema = flashDealBase
  .partial()
  .refine(endsAfterStart, { message: "The campaign must end after it starts" })
  .refine(noDuplicateLines, { message: "The same product variant cannot appear twice in one campaign" });

/**
 * Attaches the authoritative campaign price to every line. The price a shopper is
 * charged comes from the variant's price, not the product's base price, so the
 * campaign page has to quote the same figure — computing it in the browser from
 * `basePrice` (as it previously did) showed a price chargeable only by accident.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decorateDeal(deal: any) {
  const plain = typeof deal.toJSON === "function" ? deal.toJSON() : deal;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = (plain.products ?? []).map((entry: any) => {
    const product = entry.productId && typeof entry.productId === "object" ? entry.productId : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variant = product?.variants?.find((v: any) => v.sku === entry.variantSku) ?? null;
    const listPrice = variant?.price ?? product?.basePrice ?? null;
    const match: FlashDealMatch = {
      dealId: String(plain.id ?? plain._id),
      slug: plain.slug,
      title: plain.title,
      discount: entry.discount ?? 0,
      discountType: entry.discountType ?? "percent",
      dealStock: entry.dealStock ?? null,
      dealSold: entry.dealSold ?? 0,
      remaining: entry.dealStock === null || entry.dealStock === undefined ? null : Math.max(0, entry.dealStock - (entry.dealSold ?? 0)),
    };

    const dealStock = match.dealStock;
    const remaining = match.remaining;
    // Campaign allowance aside, a line nobody can buy is sold out: `stock - reserved`
    // is the real availability everywhere else in the app.
    const variantAvailable = variant ? Math.max(0, (variant.stock ?? 0) - (variant.reserved ?? 0)) : 0;
    const available = remaining === null ? variantAvailable : Math.min(remaining, variantAvailable);

    return {
      ...entry,
      listPrice,
      dealPrice: listPrice === null ? null : flashDealUnitPrice(listPrice, match),
      discountPercent: listPrice === null ? 0 : flashDealPercentOff(listPrice, match),
      dealStock,
      dealSold: match.dealSold,
      remaining,
      available,
      soldOut: available <= 0,
    };
  });

  return { ...plain, products };
}

const PUBLIC_PRODUCT_FIELDS = "name slug images currency basePrice variants published approvalStatus";

export async function listActiveFlashDealsHandler(_req: Request, res: Response) {
  const now = new Date();
  const deals = await FlashDeal.find({ active: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
    .populate("products.productId", PUBLIC_PRODUCT_FIELDS)
    .sort({ featured: -1, endsAt: 1 });
  res.json({ items: deals.map((deal) => decorateDeal(publicView(deal))) });
}

// Public by id. Scoped to a campaign that is live right now: the previous version
// served scheduled and expired campaigns to anyone who knew (or guessed) an id,
// leaking unannounced promotions.
export async function getFlashDealHandler(req: Request, res: Response) {
  const now = new Date();
  const deal = await FlashDeal.findOne({
    _id: req.params.id,
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).populate("products.productId", PUBLIC_PRODUCT_FIELDS);
  if (!deal) throw new ApiError(404, "Flash deal not found");
  res.json(decorateDeal(publicView(deal)));
}

// Public campaign page. Only returns a deal that is live right now — a scheduled
// or finished campaign must not be reachable by guessing its URL.
export async function getFlashDealBySlugHandler(req: Request, res: Response) {
  const now = new Date();
  const deal = await FlashDeal.findOne({
    slug: req.params.slug,
    active: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).populate("products.productId", PUBLIC_PRODUCT_FIELDS);

  if (!deal) throw new ApiError(404, "Flash deal not found");
  res.json(decorateDeal(publicView(deal)));
}

/**
 * Drops campaign lines whose product is no longer buyable. The legacy storefront
 * rendered deal rows straight from the join, so an unpublished or still-unapproved
 * product stayed on the campaign page and 404'd when clicked.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publicView(deal: any) {
  const plain = deal.toJSON();
  return {
    ...plain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: (plain.products ?? []).filter((entry: any) => {
      const product = entry.productId;
      if (!product || typeof product !== "object") return false;
      return product.published === true && product.approvalStatus === "approved";
    }),
  };
}

export async function listAdminFlashDealsHandler(_req: Request, res: Response) {
  const deals = await FlashDeal.find().populate("products.productId", PUBLIC_PRODUCT_FIELDS).sort({ createdAt: -1 });
  res.json({ items: deals.map(decorateDeal) });
}

/**
 * Rejects campaign lines that name a product or SKU that does not exist: the
 * legacy admin stored whatever product ids the form posted, and a bad row then
 * produced a campaign entry that could never match a cart line.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertProductsExist(products: any[]) {
  const ids = [...new Set(products.map((entry) => String(entry.productId)))];
  const found = await Product.find({ _id: { $in: ids } }, { variants: 1 });
  const byId = new Map(found.map((product) => [String(product._id), product]));
  for (const entry of products) {
    const product = byId.get(String(entry.productId));
    if (!product) throw new ApiError(400, `Product ${entry.productId} does not exist`);
    if (!product.variants.some((variant) => variant.sku === entry.variantSku)) {
      throw new ApiError(400, `Product ${entry.productId} has no variant "${entry.variantSku}"`);
    }
  }
}

export async function createFlashDealHandler(req: Request, res: Response) {
  await assertProductsExist(req.body.products ?? []);
  const slug = req.body.slug ? slugify(req.body.slug) : uniqueSlug(req.body.title);
  const deal = await FlashDeal.create({ ...req.body, slug });
  // Legacy `update_featured` demoted every other campaign first: only one deal is
  // ever promoted on the home page.
  if (deal.featured) await FlashDeal.updateMany({ _id: { $ne: deal._id } }, { featured: false });
  res.status(201).json(decorateDeal(deal));
}

export async function updateFlashDealHandler(req: Request, res: Response) {
  if (req.body.products) await assertProductsExist(req.body.products);

  // Campaign lines are replaced wholesale by the admin form (as in the legacy
  // controller, which deleted and re-inserted them). Carry each line's already
  // consumed allowance across the rewrite so an edit cannot resell a sold-out cap.
  if (req.body.products) {
    const current = await FlashDeal.findById(req.params.id, { products: 1 });
    if (!current) throw new ApiError(404, "Flash deal not found");
    const soldByKey = new Map(
      (current.products ?? []).map((entry) => [`${String(entry.productId)}|${entry.variantSku}`, entry.dealSold ?? 0]),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.body.products = req.body.products.map((entry: any) => ({
      ...entry,
      dealSold: soldByKey.get(`${String(entry.productId)}|${entry.variantSku}`) ?? 0,
    }));
  }

  if (req.body.slug) req.body.slug = slugify(req.body.slug);
  const deal = await FlashDeal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!deal) throw new ApiError(404, "Flash deal not found");
  if (deal.featured) await FlashDeal.updateMany({ _id: { $ne: deal._id } }, { featured: false });
  res.json(decorateDeal(deal));
}

export async function deleteFlashDealHandler(req: Request, res: Response) {
  const deleted = await FlashDeal.findByIdAndUpdate(req.params.id, { active: false });
  if (!deleted) throw new ApiError(404, "Flash deal not found");
  res.status(204).send();
}
