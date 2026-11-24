import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Shop } from "../models/Shop.js";
import { SellerVerificationField } from "../models/Settings.js";
import { SellerLedger, SellerWithdrawRequest } from "../models/Ledger.js";
import { Order } from "../models/Order.js";
import { awardClubPointsForOrder } from "../services/clubpoints.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import { inventoryStatus } from "../services/order-state.js";
import { sellerOrderView } from "../services/order.service.js";
import { lockSellerFunds, sellerFunds } from "../services/seller-funds.service.js";
import { publicSellerIds, PUBLIC_SHOP_FIELDS } from "../services/catalog-visibility.service.js";

export const shopSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.record(z.string()).optional(),
  // Charged once per order when the store runs seller-wise shipping.
  shippingCost: z.number().min(0).optional(),
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
  const shop = await Shop.findOne({ slug: req.params.slug, verified: true, sellerId: { $in: await publicSellerIds() } }).select(PUBLIC_SHOP_FIELDS);
  if (!shop) throw new ApiError(404, "Shop not found");
  res.json(shop);
}

export async function getShopBySellerIdHandler(req: Request, res: Response) {
  const ids = await publicSellerIds();
  const shop = ids.some((id) => String(id) === req.params.sellerId)
    ? await Shop.findOne({ sellerId: req.params.sellerId, verified: true }).select(PUBLIC_SHOP_FIELDS) : null;
  if (!shop) throw new ApiError(404, "Shop not found");
  res.json(shop);
}

// Authoritative "how much does the platform owe this seller" — summed straight
// from the immutable ledger, never from a mutable cached balance field.
export async function getSellerLedgerSummaryHandler(req: Request, res: Response) {
  const sellerId = req.user!.id;
  const funds = await sellerFunds(sellerId);
  const paidOut = await SellerWithdrawRequest.aggregate([
    { $match: { sellerId: { $eq: new mongoose.Types.ObjectId(sellerId) }, status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  res.json({
    ledgerBalance: funds.balance,
    withdrawn: paidOut[0]?.total ?? 0,
    reserved: funds.reserved,
    available: funds.available,
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
  const session = await mongoose.startSession();
  try {
    let request;
    await session.withTransaction(async () => {
      await lockSellerFunds(req.user!.id, session);
      const funds = await sellerFunds(req.user!.id, session);
      if (req.body.amount > funds.available) throw new ApiError(409, "Withdrawal exceeds your available balance");
      [request] = await SellerWithdrawRequest.create([{ ...req.body, sellerId: req.user!.id }], { session });
    });
    res.status(201).json(request);
  } finally { await session.endSession(); }
}

export async function listMyWithdrawRequestsHandler(req: Request, res: Response) {
  const items = await SellerWithdrawRequest.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

// Sellers may only move their own shipment forward through the fulfillment chain.
// Jumping backwards (delivered -> processing) or out of a terminal state is rejected,
// because downstream side effects (club points, refund windows) already fired.
const FULFILLMENT_FLOW: Record<string, string[]> = {
  pending: [],
  confirmed: ["processing", "shipped"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const fulfillmentSchema = z.object({
  status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

export async function fulfillOrderItemHandler(req: Request, res: Response) {
  const { orderId } = req.params;
  const { status } = req.body as { status: string };

  const order = await Order.findOne({ _id: orderId, "details.sellerId": req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");
  if (inventoryStatus(order) !== "confirmed" || ["cancelled", "refunded"].includes(order.status)) {
    throw new ApiError(409, "This order is not available for fulfillment");
  }

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
  if (status === "delivered") {
    await awardClubPointsForOrder(String(order._id));
  }

  res.json(sellerOrderView(order, req.user!.id));
}

// --- Shop verification --------------------------------------------------------

export const shopVerificationSchema = z.object({
  verificationDocs: z.array(z.string().url()).max(10).default([]),
  // Answers to the admin-defined form, keyed by field id. Values are a string for
  // text/select/radio, a string array for multi-select, and a URL for file fields.
  answers: z.record(z.union([z.string(), z.array(z.string())])).default({}),
});

/** The form an admin composed, for the seller's verification page to render. */
export async function getVerificationFormHandler(_req: Request, res: Response) {
  res.json({ items: await SellerVerificationField.find({ active: true }).sort({ order: 1, createdAt: 1 }) });
}

// Submitting documents resets the shop to "pending" for re-review. A shop that is
// already approved keeps its `verified` flag until an admin actually decides,
// so re-submitting extra paperwork never de-lists a live storefront mid-review.
export async function applyForShopVerificationHandler(req: Request, res: Response) {
  const shop = await Shop.findOne({ sellerId: req.user!.id });
  if (!shop) throw new ApiError(404, "Create your shop before applying for verification");
  if (shop.verificationStatus === "pending" && shop.verificationDocs.length > 0) {
    throw new ApiError(409, "A verification request is already under review");
  }

  // Required fields are enforced against the live form definition rather than a
  // fixed schema, since an admin can add or remove questions at any time.
  const fields = await SellerVerificationField.find({ active: true });
  const answers = req.body.answers as Record<string, string | string[]>;

  for (const field of fields) {
    if (!field.required) continue;
    const answer = answers[String(field._id)];
    const empty = answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);
    if (empty) throw new ApiError(422, `"${field.label}" is required`);
  }

  // Only answers to fields that currently exist are stored — a client cannot
  // smuggle arbitrary keys into the shop document.
  const knownIds = new Set(fields.map((f) => String(f._id)));
  shop.set(
    "verificationAnswers",
    Object.fromEntries(Object.entries(answers).filter(([id]) => knownIds.has(id))),
  );
  shop.verificationDocs = req.body.verificationDocs;
  shop.verificationStatus = "pending";
  await shop.save();
  res.json(shop);
}
