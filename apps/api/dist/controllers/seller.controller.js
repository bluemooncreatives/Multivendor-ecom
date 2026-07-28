import { z } from "zod";
import mongoose from "mongoose";
import { Shop } from "../models/Shop.js";
import { SellerLedger, SellerWithdrawRequest } from "../models/Ledger.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../middleware/errorHandler.js";
export const shopSchema = z.object({
    name: z.string().min(1).max(120),
    slug: z.string().min(1).max(140),
    logoUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    socialLinks: z.record(z.string()).optional(),
});
export async function getMyShopHandler(req, res) {
    const shop = await Shop.findOne({ sellerId: req.user.id });
    if (!shop)
        throw new ApiError(404, "Shop not found. Create your shop first.");
    res.json(shop);
}
export async function createOrUpdateShopHandler(req, res) {
    const shop = await Shop.findOneAndUpdate({ sellerId: req.user.id }, { ...req.body, sellerId: req.user.id }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json(shop);
}
export async function getPublicShopHandler(req, res) {
    const shop = await Shop.findOne({ slug: req.params.slug, verified: true });
    if (!shop)
        throw new ApiError(404, "Shop not found");
    res.json(shop);
}
// Authoritative "how much does the platform owe this seller" — summed straight
// from the immutable ledger, never from a mutable cached balance field.
export async function getSellerLedgerSummaryHandler(req, res) {
    const sellerId = req.user.id;
    const [totals] = await SellerLedger.aggregate([
        { $match: { sellerId: { $eq: new mongoose.Types.ObjectId(sellerId) } } },
        { $group: { _id: null, balance: { $sum: "$amount" } } },
    ]);
    const paidOut = await SellerWithdrawRequest.aggregate([
        { $match: { sellerId: { $eq: new mongoose.Types.ObjectId(sellerId) }, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    res.json({
        ledgerBalance: totals?.balance ?? 0,
        withdrawn: paidOut[0]?.total ?? 0,
        available: (totals?.balance ?? 0) - (paidOut[0]?.total ?? 0),
    });
}
export async function listSellerLedgerHandler(req, res) {
    const entries = await SellerLedger.find({ sellerId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ items: entries });
}
export const withdrawRequestSchema = z.object({
    amount: z.number().min(1),
    method: z.enum(["bank_transfer", "wallet", "manual"]),
    bankDetails: z.record(z.unknown()).optional(),
});
export async function createWithdrawRequestHandler(req, res) {
    const request = await SellerWithdrawRequest.create({ ...req.body, sellerId: req.user.id });
    res.status(201).json(request);
}
export async function listMyWithdrawRequestsHandler(req, res) {
    const items = await SellerWithdrawRequest.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
}
export async function fulfillOrderItemHandler(req, res) {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findOne({ _id: orderId, "details.sellerId": req.user.id });
    if (!order)
        throw new ApiError(404, "Order not found");
    const detail = order.details.find((d) => String(d.sellerId) === req.user.id);
    if (!detail)
        throw new ApiError(404, "You do not have items on this order");
    detail.status = status;
    if (status === "delivered")
        detail.deliveredAt = new Date();
    await order.save();
    res.json(order);
}
//# sourceMappingURL=seller.controller.js.map