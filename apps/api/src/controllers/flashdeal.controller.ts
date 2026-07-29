import type { Request, Response } from "express";
import { z } from "zod";
import { FlashDeal } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

export const flashDealSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).max(140),
  bannerUrl: z.string().url().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string(),
        discountPercent: z.number().min(0).max(90),
        dealStock: z.number().int().min(0),
      }),
    )
    .min(1),
});

export async function listActiveFlashDealsHandler(_req: Request, res: Response) {
  const now = new Date();
  const deals = await FlashDeal.find({ active: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
    .populate("products.productId", "name slug images currency")
    .sort({ endsAt: 1 });
  res.json({ items: deals });
}

export async function getFlashDealHandler(req: Request, res: Response) {
  const deal = await FlashDeal.findById(req.params.id).populate("products.productId");
  if (!deal) throw new ApiError(404, "Flash deal not found");
  res.json(deal);
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
  }).populate("products.productId");

  if (!deal) throw new ApiError(404, "Flash deal not found");
  res.json(deal);
}

export async function listAdminFlashDealsHandler(_req: Request, res: Response) {
  res.json({ items: await FlashDeal.find().sort({ createdAt: -1 }) });
}

export async function createFlashDealHandler(req: Request, res: Response) {
  const deal = await FlashDeal.create(req.body);
  res.status(201).json(deal);
}

export async function updateFlashDealHandler(req: Request, res: Response) {
  const deal = await FlashDeal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!deal) throw new ApiError(404, "Flash deal not found");
  res.json(deal);
}

export async function deleteFlashDealHandler(req: Request, res: Response) {
  const deleted = await FlashDeal.findByIdAndUpdate(req.params.id, { active: false });
  if (!deleted) throw new ApiError(404, "Flash deal not found");
  res.status(204).send();
}
