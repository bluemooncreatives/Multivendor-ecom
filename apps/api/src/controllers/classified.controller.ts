import type { Request, Response } from "express";
import { z } from "zod";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { Category } from "../models/Category.js";
import { assertCustomerCanAddClassified } from "../services/quota.service.js";
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

// Public browse: category (including its whole subtree), free-text search and
// city, matching the legacy classified listing filters.
export async function listClassifiedsHandler(req: Request, res: Response) {
  const { categoryId, location, q } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(60, Number(req.query.pageSize) || 24);

  const filter: Record<string, unknown> = { status: "approved" };

  if (categoryId) {
    const descendants = await Category.find({ ancestors: categoryId }, { _id: 1 });
    filter.categoryId = { $in: [categoryId, ...descendants.map((c) => c._id)] };
  }
  if (location) filter.location = { $regex: String(location).slice(0, 60), $options: "i" };
  if (q) filter.$text = { $search: String(q).slice(0, 80) };

  const [items, total] = await Promise.all([
    CustomerProduct.find(filter)
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    CustomerProduct.countDocuments(filter),
  ]);

  res.json({ items, total, page, pageSize });
}

export async function getClassifiedBySlugHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findOne({ slug: req.params.slug, status: "approved" }).populate(
    "categoryId",
    "name slug",
  );
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
  await assertCustomerCanAddClassified(req.user!.id);
  const slug = await uniqueSlug(req.body.slug || req.body.title);
  const item = await CustomerProduct.create({ ...req.body, slug, userId: req.user!.id, status: "pending" });
  res.status(201).json(item);
}

export async function listMyClassifiedsHandler(req: Request, res: Response) {
  const items = await CustomerProduct.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
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
