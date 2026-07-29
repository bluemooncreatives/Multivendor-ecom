import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Shop } from "../models/Shop.js";
import { SellerLedger, SellerWithdrawRequest } from "../models/Ledger.js";
import { Order } from "../models/Order.js";
import { awardClubPointsForOrder } from "../services/clubpoints.service.js";
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

export async function getMyShopHandler(req: Request, res: Response) {
  const shop = await Shop.findOne({ sellerId: req.user!.id });
  if (!shop) throw new ApiError(404, "Shop not found. Create your shop first.");
  res.json(shop);
}

export async function createOrUpdateShopHandler(req: Request, res: Response) {
  const shop = await Shop.findOneAndUpdate(
    { sellerId: req.user!.id },
    { ...req.body, sellerId: req.user!.id },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.json(shop);
}

export async function getPublicShopHandler(req: Request, res: Response) {
  const shop = await Shop.findOne({ slug: req.params.slug, verified: true });
  if (!shop) throw new ApiError(404, "Shop not found");
  res.json(shop);
}

export async function getShopBySellerIdHandler(req: Request, res: Response) {
  const shop = await Shop.findOne({ sellerId: req.params.sellerId, verified: true });
  if (!shop) throw new ApiError(404, "Shop not found");
  res.json(shop);
}

// Authoritative "how much does the platform owe this seller" — summed straight
// from the immutable ledger, never from a mutable cached balance field.
export async function getSellerLedgerSummaryHandler(req: Request, res: Response) {
  const sellerId = req.user!.id;
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

export async function listSellerLedgerHandler(req: Request, res: Response) {
  const entries = await SellerLedger.find({ sellerId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items: entries });
}

export const withdrawRequestSchema = z.object({
  amount: z.number().min(1),
  method: z.enum(["bank_transfer", "wallet", "manual"]),
  bankDetails: z.record(z.unknown()).optional(),
});

export async function createWithdrawRequestHandler(req: Request, res: Response) {
  const request = await SellerWithdrawRequest.create({ ...req.body, sellerId: req.user!.id });
  res.status(201).json(request);
}

export async function listMyWithdrawRequestsHandler(req: Request, res: Response) {
  const items = await SellerWithdrawRequest.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

// Sellers may only move their own shipment forward through the fulfillment chain.
// Jumping backwards (delivered -> processing) or out of a terminal state is rejected,
// because downstream side effects (club points, refund windows) already fired.
const FULFILLMENT_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export async function fulfillOrderItemHandler(req: Request, res: Response) {
  const { orderId } = req.params;
  const { status } = req.body as { status: string };

  const order = await Order.findOne({ _id: orderId, "details.sellerId": req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");

  const detail = order.details.find((d) => String(d.sellerId) === req.user!.id);
  if (!detail) throw new ApiError(404, "You do not have items on this order");

  if (!FULFILLMENT_FLOW[detail.status]?.includes(status)) {
    throw new ApiError(409, `Cannot move a ${detail.status} shipment to ${status}`);
  }

  detail.status = status as never;
  if (status === "delivered") detail.deliveredAt = new Date();
  if (status === "cancelled") detail.cancelledAt = new Date();

  // Roll the per-seller shipment states up into one order-level status, so a
  // multi-vendor order only reads "delivered" once every seller has delivered.
  const statuses = order.details.map((d) => d.status);
  if (statuses.every((s) => s === "delivered")) order.status = "delivered";
  else if (statuses.every((s) => s === "cancelled")) order.status = "cancelled";
  else if (statuses.some((s) => s === "shipped" || s === "delivered")) order.status = "shipped";
  else if (statuses.some((s) => s === "processing")) order.status = "processing";

  await order.save();

  // Loyalty points are awarded from the order-level "delivered" transition and are
  // idempotent on the order id, so a repeated delivered-write cannot award twice.
  if (order.status === "delivered") {
    await awardClubPointsForOrder(String(order._id));
  }

  res.json(order);
}

// --- Shop verification --------------------------------------------------------

export const shopVerificationSchema = z.object({
  verificationDocs: z.array(z.string().url()).min(1).max(10),
});

// Submitting documents resets the shop to "pending" for re-review. A shop that is
// already approved keeps its `verified` flag until an admin actually decides,
// so re-submitting extra paperwork never de-lists a live storefront mid-review.
export async function applyForShopVerificationHandler(req: Request, res: Response) {
  const shop = await Shop.findOne({ sellerId: req.user!.id });
  if (!shop) throw new ApiError(404, "Create your shop before applying for verification");
  if (shop.verificationStatus === "pending" && shop.verificationDocs.length > 0) {
    throw new ApiError(409, "A verification request is already under review");
  }

  shop.verificationDocs = req.body.verificationDocs;
  shop.verificationStatus = "pending";
  await shop.save();
  res.json(shop);
}
