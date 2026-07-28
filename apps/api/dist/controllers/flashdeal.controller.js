import { z } from "zod";
import { FlashDeal } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";
export const flashDealSchema = z.object({
    title: z.string().min(1),
    bannerUrl: z.string().url().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    products: z
        .array(z.object({
        productId: z.string(),
        variantSku: z.string(),
        discountPercent: z.number().min(0).max(90),
        dealStock: z.number().int().min(0),
    }))
        .min(1),
});
export async function listActiveFlashDealsHandler(_req, res) {
    const now = new Date();
    const deals = await FlashDeal.find({ active: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
        .populate("products.productId", "name slug images currency")
        .sort({ endsAt: 1 });
    res.json({ items: deals });
}
export async function getFlashDealHandler(req, res) {
    const deal = await FlashDeal.findById(req.params.id).populate("products.productId");
    if (!deal)
        throw new ApiError(404, "Flash deal not found");
    res.json(deal);
}
export async function listAdminFlashDealsHandler(_req, res) {
    res.json({ items: await FlashDeal.find().sort({ createdAt: -1 }) });
}
export async function createFlashDealHandler(req, res) {
    const deal = await FlashDeal.create(req.body);
    res.status(201).json(deal);
}
export async function updateFlashDealHandler(req, res) {
    const deal = await FlashDeal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!deal)
        throw new ApiError(404, "Flash deal not found");
    res.json(deal);
}
export async function deleteFlashDealHandler(req, res) {
    const deleted = await FlashDeal.findByIdAndUpdate(req.params.id, { active: false });
    if (!deleted)
        throw new ApiError(404, "Flash deal not found");
    res.status(204).send();
}
//# sourceMappingURL=flashdeal.controller.js.map