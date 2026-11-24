import type { Request, Response } from "express";
import { z } from "zod";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { Category } from "../models/Category.js";
import { BusinessSetting } from "../models/Settings.js";
import { consumeCustomerUpload } from "../services/package.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export const classifiedSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("INR"),
  categoryId: z.string(),
  subCategoryId: z.string().nullable().optional(),
  subSubCategoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  condition: z.enum(["new", "used"]).default("used"),
  unit: z.string().max(20).default("pc"),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  thumbnailUrl: z.string().url().nullable().optional(),
  videoProvider: z.enum(["youtube", "dailymotion", "vimeo"]).nullable().optional(),
  videoLink: z.string().url().nullable().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  metaImageUrl: z.string().url().nullable().optional(),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
});

/** Classified listings are an add-on the store can switch off entirely. */
async function assertClassifiedsEnabled() {
  const settings = await BusinessSetting.findOne({ key: "business" }, { activation: 1 });
  if (settings?.activation?.classifiedProduct === false) {
    throw new ApiError(403, "Classified listings are turned off");
  }
}

/**
 * Public browse. The legacy listing (`CustomerProductController@search`) filtered
 * on brand, category at all three levels, condition and a free-text query, and
 * sorted by newest, oldest, price up or price down. The rewrite supported only
 * category, city and text, so a shopper could not sort at all and the brand and
 * condition filters silently did nothing.
 */
export async function listClassifiedsHandler(req: Request, res: Response) {
  await assertClassifiedsEnabled();
  const { categoryId, brandId, location, condition, q, sort } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(60, Number(req.query.pageSize) || 24);

  const filter: Record<string, unknown> = { status: "approved" };

  if (categoryId) {
    const descendants = await Category.find({ ancestors: categoryId }, { _id: 1 });
    filter.categoryId = { $in: [categoryId, ...descendants.map((c) => c._id)] };
  }
  if (brandId) filter.brandId = brandId;
  if (condition === "new" || condition === "used") filter.condition = condition;
  if (location) filter.location = { $regex: String(location).slice(0, 60), $options: "i" };
  if (q) filter.$text = { $search: String(q).slice(0, 80) };

  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {
      ...(Number.isFinite(minPrice) ? { $gte: minPrice } : {}),
      ...(Number.isFinite(maxPrice) ? { $lte: maxPrice } : {}),
    };
  }

  // Legacy sort_by 1-4; its 5 and 6 were condition filters, handled above.
  const SORTS: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };

  const [items, total] = await Promise.all([
    CustomerProduct.find(filter)
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .sort(SORTS[sort ?? "newest"] ?? SORTS.newest!)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    CustomerProduct.countDocuments(filter),
  ]);

  res.json({ items, total, page, pageSize });
}

/** Admin moderation queue (legacy `classified_products.index`). */
export async function listAdminClassifiedsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const filter = status && ["draft", "pending", "approved", "rejected", "sold"].includes(status) ? { status } : {};
  const items = await CustomerProduct.find(filter)
    .populate("userId", "name email")
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
    .limit(300);
  res.json({ items, pending: await CustomerProduct.countDocuments({ status: "pending" }) });
}

export async function getClassifiedBySlugHandler(req: Request, res: Response) {
  await assertClassifiedsEnabled();
  const item = await CustomerProduct.findOne({ slug: req.params.slug, status: "approved" })
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug")
    .populate("userId", "name avatarUrl");
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}

/** Slugs must be unique, so a colliding title gets a short suffix. */
async function uniqueSlug(base: string): Promise<string> {
  const root =
    base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180) || "listing";

  if (!(await CustomerProduct.exists({ slug: root }))) return root;
  return `${root}-${Date.now().toString(36)}`;
}

export async function createClassifiedHandler(req: Request, res: Response) {
  await assertClassifiedsEnabled();
  // Legacy `CustomerProductController@store` decremented `users.remaining_uploads`
  // once per listing; the allowance is consumed up front here so two concurrent
  // posts cannot both spend the last upload.
  const release = await consumeCustomerUpload(req.user!.id);
  try {
    const slug = await uniqueSlug(req.body.slug || req.body.title);
    const item = await CustomerProduct.create({ ...req.body, slug, userId: req.user!.id, status: "pending" });
    res.status(201).json(item);
  } catch (error) {
    await release();
    throw error;
  }
}

export async function listMyClassifiedsHandler(req: Request, res: Response) {
  const items = await CustomerProduct.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

/** The owner's own listing, readable whatever its moderation status. */
export async function getMyClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findOne({ _id: req.params.id, userId: req.user!.id })
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug");
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}

export async function updateClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { ...req.body, status: "pending" },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}

export async function deleteClassifiedHandler(req: Request, res: Response) {
  const deleted = await CustomerProduct.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!deleted) throw new ApiError(404, "Listing not found");
  res.status(204).send();
}

export const classifiedStatusSchema = z.object({ status: z.enum(["draft", "pending", "sold"]) });

/**
 * The owner's own status changes: taking a listing down (draft), putting it back
 * up for review (pending) or marking it sold. Approval stays with staff.
 */
export async function setMyClassifiedStatusHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!item) throw new ApiError(404, "Listing not found");
  // Re-submitting a rejected listing goes back through moderation, so "pending"
  // is allowed; "approved" is never self-serve.
  item.status = req.body.status;
  await item.save();
  res.json(item);
}

export const moderateClassifiedSchema = z.object({ approved: z.boolean() });

export async function moderateClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findByIdAndUpdate(
    req.params.id,
    { status: req.body.approved ? "approved" : "rejected" },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}
