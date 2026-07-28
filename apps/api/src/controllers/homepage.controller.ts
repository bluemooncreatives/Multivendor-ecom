import type { Request, Response } from "express";
import { z } from "zod";
import { Slider, Banner, HomeCategory } from "../models/Content.js";
import { Category, Brand } from "../models/Category.js";
import { ApiError } from "../middleware/errorHandler.js";

// Single call for the whole homepage — one round trip for the storefront instead
// of one per section.
export async function getHomepageSectionsHandler(_req: Request, res: Response) {
  const [sliders, banners, homeCategories, topCategories, topBrands] = await Promise.all([
    Slider.find({ active: true }).sort({ order: 1 }),
    Banner.find({ active: true }).sort({ createdAt: -1 }),
    HomeCategory.find().populate("categoryId").sort({ order: 1 }),
    Category.find({ featured: true }).limit(10),
    Brand.find({ featured: true }).limit(10),
  ]);
  res.json({ sliders, banners, homeCategories, topCategories, topBrands });
}

// --- Sliders -----------------------------------------------------------------

export const sliderSchema = z.object({
  imageUrl: z.string().url(),
  linkUrl: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function listAdminSlidersHandler(_req: Request, res: Response) {
  res.json({ items: await Slider.find().sort({ order: 1 }) });
}
export async function createSliderHandler(req: Request, res: Response) {
  res.status(201).json(await Slider.create(req.body));
}
export async function updateSliderHandler(req: Request, res: Response) {
  const doc = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Slider not found");
  res.json(doc);
}
export async function deleteSliderHandler(req: Request, res: Response) {
  const doc = await Slider.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, "Slider not found");
  res.status(204).send();
}

// --- Banners -------------------------------------------------------------------

export const bannerSchema = z.object({
  imageUrl: z.string().url(),
  linkUrl: z.string().optional(),
  placement: z.enum(["home_top", "home_middle", "category", "checkout"]),
  active: z.boolean().optional(),
});

export async function listAdminBannersHandler(_req: Request, res: Response) {
  res.json({ items: await Banner.find().sort({ createdAt: -1 }) });
}
export async function createBannerHandler(req: Request, res: Response) {
  res.status(201).json(await Banner.create(req.body));
}
export async function updateBannerHandler(req: Request, res: Response) {
  const doc = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Banner not found");
  res.json(doc);
}
export async function deleteBannerHandler(req: Request, res: Response) {
  const doc = await Banner.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, "Banner not found");
  res.status(204).send();
}

// --- Home category tiles --------------------------------------------------------

export const homeCategorySchema = z.object({
  categoryId: z.string(),
  order: z.number().int().optional(),
});

export async function listAdminHomeCategoriesHandler(_req: Request, res: Response) {
  res.json({ items: await HomeCategory.find().populate("categoryId").sort({ order: 1 }) });
}
export async function createHomeCategoryHandler(req: Request, res: Response) {
  res.status(201).json(await HomeCategory.create(req.body));
}
export async function deleteHomeCategoryHandler(req: Request, res: Response) {
  const doc = await HomeCategory.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, "Home category entry not found");
  res.status(204).send();
}

// --- Top-10 category/brand picker ------------------------------------------------

export const toggleTopSchema = z.object({ featured: z.boolean() });

export async function toggleTopCategoryHandler(req: Request, res: Response) {
  const doc = await Category.findByIdAndUpdate(req.params.id, { featured: req.body.featured }, { new: true });
  if (!doc) throw new ApiError(404, "Category not found");
  res.json(doc);
}

export async function toggleTopBrandHandler(req: Request, res: Response) {
  const doc = await Brand.findByIdAndUpdate(req.params.id, { featured: req.body.featured }, { new: true });
  if (!doc) throw new ApiError(404, "Brand not found");
  res.json(doc);
}
