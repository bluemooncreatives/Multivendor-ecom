import type { Request, Response } from "express";
import { z } from "zod";
import { Category, Brand, Attribute } from "../models/Category.js";
import { ApiError } from "../middleware/errorHandler.js";

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  parentId: z.string().nullable().optional(),
  iconUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  commissionRate: z.number().min(0).max(100).nullable().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  logoUrl: z.string().url().optional(),
  categoryIds: z.array(z.string()).optional(),
});

// Resolves both the depth and the full ancestor chain in one parent lookup, so a
// category never ends up with a level that disagrees with its ancestors array.
async function resolvePlacement(
  parentId: string | null | undefined,
): Promise<{ level: 0 | 1 | 2; ancestors: unknown[] }> {
  if (!parentId) return { level: 0, ancestors: [] };
  const parent = await Category.findById(parentId);
  if (!parent) throw new ApiError(400, "Parent category not found");
  if (parent.level >= 2) throw new ApiError(400, "Category nesting is limited to 3 levels");
  return { level: (parent.level + 1) as 1 | 2, ancestors: [...parent.ancestors, parent._id] };
}

// Re-points every descendant after a category is re-parented. Without this a moved
// subtree keeps stale ancestors and disappears from subtree-filtered browse pages.
async function reindexDescendants(rootId: unknown) {
  const children = await Category.find({ parentId: rootId });
  for (const child of children) {
    const { level, ancestors } = await resolvePlacement(String(rootId));
    child.level = level;
    child.ancestors = ancestors as never;
    await child.save();
    await reindexDescendants(child._id);
  }
}

export async function listCategoriesHandler(_req: Request, res: Response) {
  const categories = await Category.find({ active: true }).sort({ level: 1, order: 1 });
  res.json({ items: categories });
}

export async function createCategoryHandler(req: Request, res: Response) {
  const { level, ancestors } = await resolvePlacement(req.body.parentId);
  const category = await Category.create({ ...req.body, level, ancestors });
  res.status(201).json(category);
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const reparented = req.body.parentId !== undefined;
  const placement = reparented ? await resolvePlacement(req.body.parentId) : undefined;

  // A category cannot be moved beneath itself — that would build a cycle the
  // recursive reindex below would never terminate on.
  if (reparented && req.body.parentId) {
    const target = await Category.findById(req.body.parentId);
    if (target && (String(target._id) === req.params.id || target.ancestors.some((a) => String(a) === req.params.id))) {
      throw new ApiError(400, "A category cannot be moved inside its own subtree");
    }
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(placement ?? {}) },
    { new: true },
  );
  if (!category) throw new ApiError(404, "Category not found");
  if (reparented) await reindexDescendants(category._id);
  res.json(category);
}

// --- Legacy cascade endpoints -------------------------------------------------
// The product form walks category -> sub-category -> sub-sub-category, then loads
// the brands and attributes bound to the deepest node.

export async function listChildCategoriesHandler(req: Request, res: Response) {
  const parentId = req.query.parentId ? String(req.query.parentId) : null;
  res.json({ items: await Category.find({ parentId, active: true }).sort({ order: 1, name: 1 }) });
}

// Brands/attributes with an empty categoryIds are global, so they must appear
// alongside the ones explicitly bound to the selected node.
export async function listBrandsForCategoryHandler(req: Request, res: Response) {
  const categoryId = String(req.query.categoryId ?? "");
  if (!categoryId) throw new ApiError(400, "categoryId is required");
  res.json({
    items: await Brand.find({
      active: true,
      $or: [{ categoryIds: categoryId }, { categoryIds: { $size: 0 } }],
    }).sort({ name: 1 }),
  });
}

export async function listAttributesForCategoryHandler(req: Request, res: Response) {
  const categoryId = String(req.query.categoryId ?? "");
  if (!categoryId) throw new ApiError(400, "categoryId is required");
  res.json({
    items: await Attribute.find({
      $or: [{ categoryIds: categoryId }, { categoryIds: { $size: 0 } }],
    }).sort({ name: 1 }),
  });
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  const hasChildren = await Category.exists({ parentId: req.params.id });
  if (hasChildren) throw new ApiError(409, "Remove or reassign child categories first");
  const deleted = await Category.findByIdAndUpdate(req.params.id, { active: false });
  if (!deleted) throw new ApiError(404, "Category not found");
  res.status(204).send();
}

export async function listBrandsHandler(_req: Request, res: Response) {
  const brands = await Brand.find({ active: true }).sort({ name: 1 });
  res.json({ items: brands });
}

export async function createBrandHandler(req: Request, res: Response) {
  const brand = await Brand.create(req.body);
  res.status(201).json(brand);
}

export async function updateBrandHandler(req: Request, res: Response) {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!brand) throw new ApiError(404, "Brand not found");
  res.json(brand);
}

// Deactivated rather than deleted: products keep a brandId reference, and hard
// deletion would leave those listings pointing at a missing document.
export async function deleteBrandHandler(req: Request, res: Response) {
  const brand = await Brand.findByIdAndUpdate(req.params.id, { active: false });
  if (!brand) throw new ApiError(404, "Brand not found");
  res.status(204).send();
}

// Full tree including inactive rows, for the admin category manager (the public
// listCategoriesHandler intentionally hides deactivated branches).
export async function listAllCategoriesHandler(_req: Request, res: Response) {
  res.json({ items: await Category.find().sort({ level: 1, order: 1 }) });
}

export async function listAllBrandsHandler(_req: Request, res: Response) {
  res.json({ items: await Brand.find().sort({ name: 1 }) });
}

export const featureToggleSchema = z.object({ featured: z.boolean() });

export async function updateCategoryFeaturedHandler(req: Request, res: Response) {
  const category = await Category.findByIdAndUpdate(req.params.id, { featured: req.body.featured }, { new: true });
  if (!category) throw new ApiError(404, "Category not found");
  res.json(category);
}

export async function updateBrandFeaturedHandler(req: Request, res: Response) {
  const brand = await Brand.findByIdAndUpdate(req.params.id, { featured: req.body.featured }, { new: true });
  if (!brand) throw new ApiError(404, "Brand not found");
  res.json(brand);
}
