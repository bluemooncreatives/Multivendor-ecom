import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { RefundRequest, RefundConfig } from "../models/Refund.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger, InventoryMovement } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";
import { allocateUnits } from "../utils/allocation.js";
import { ClubPointTransaction } from "../models/ClubPoints.js";
import { User } from "../models/User.js";
import { reverseEarnedPointsForShipment } from "../services/clubpoints.service.js";
import { reverseAffiliateForShipment } from "../services/affiliate.service.js";

export async function getRefundConfig() {
  return (await RefundConfig.findOne({ key: "refund" })) ?? (await RefundConfig.create({}));
}

export const refundRequestSchema = z.object({
  orderId: z.string(),
  sellerId: z.string().nullable().transform((value) => value === "null" || value === "__admin__" ? null : value),
  reason: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(6).default([]),
});

// The refundable amount is derived from the order's own seller sub-total, never
// taken from the request body — the legacy endpoint trusted a client-supplied
// `amount`, so a customer could request a refund larger than they ever paid.
export async function createRefundRequestHandler(req: Request, res: Response) {
  const config = await getRefundConfig();

  const order = await Order.findOne({ _id: req.body.orderId, userId: req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus !== "paid") throw new ApiError(409, "Only paid orders can be refunded");

  const detailIndex = order.details.findIndex((d) => String(d.sellerId) === String(req.body.sellerId));
  const detail = detailIndex >= 0 ? order.details[detailIndex]! : null;
  if (!detail) throw new ApiError(404, "That seller has no items on this order");
  if (detail.status !== "delivered") throw new ApiError(409, "You can request a refund once the items are delivered");
  // Mixed shipments are allowed: only the refundable items are returned. A
  // shipment with no refundable items at all has nothing to refund.
  if (!detail.items.some((item) => item.refundable)) throw new ApiError(409, "None of the items in this shipment are refundable");

  if (config.requestWindowDays > 0 && detail.deliveredAt) {
    const deadline = new Date(detail.deliveredAt.getTime() + config.requestWindowDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      throw new ApiError(409, `The ${config.requestWindowDays}-day refund window for this delivery has closed`);
    }
  }

  // One open/settled request per (order, seller) — re-requesting a refund that was
  // already paid out would otherwise credit the wallet a second time.
  const existing = await RefundRequest.findOne({
    orderId: order._id,
    sellerId: req.body.sellerId,
    status: { $in: ["pending", "approved", "refunded"] },
  });
  if (existing) throw new ApiError(409, "A refund request for these items already exists");

  const breakdown = refundBreakdown(order, detailIndex);
  const request = await RefundRequest.create({
    orderId: order._id,
    sellerId: req.body.sellerId,
    userId: req.user!.id,
    reason: req.body.reason,
    images: req.body.images,
    lines: breakdown.lines,
    merchandise: breakdown.merchandise,
    tax: breakdown.tax,
    discount: breakdown.discount,
    amount: breakdown.amount,
  });
  res.status(201).json(request);
}

// Lets the order UI decide whether to show a "Request refund" action per shipment.
export async function getRefundEligibilityHandler(req: Request, res: Response) {
  const config = await getRefundConfig();
  const order = await Order.findOne({ _id: req.params.orderId, userId: req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");

  const existing = await RefundRequest.find({
    orderId: order._id,
    status: { $in: ["pending", "approved", "refunded"] },
  }).select("sellerId status");
  const claimed = new Set(existing.map((r) => String(r.sellerId)));

  const shipments = order.details.map((detail, index) => {
    const deadline =
      config.requestWindowDays > 0 && detail.deliveredAt
        ? new Date(detail.deliveredAt.getTime() + config.requestWindowDays * 24 * 60 * 60 * 1000)
        : null;
    const breakdown = refundBreakdown(order, index);
    return {
      sellerId: String(detail.sellerId),
      amount: breakdown.amount,
      merchandise: breakdown.merchandise,
      tax: breakdown.tax,
      discount: breakdown.discount,
      // Set when the shipment also holds non-refundable items, so the UI can tell
      // the shopper only part of the shipment will be refunded.
      partial: !breakdown.fullShipment,
      eligible:
        order.paymentStatus === "paid" &&
        detail.status === "delivered" &&
        detail.items.some((item) => item.refundable) &&
        !claimed.has(String(detail.sellerId)) &&
        (!deadline || new Date() <= deadline),
      windowClosesAt: deadline,
      alreadyRequested: claimed.has(String(detail.sellerId)),
    };
  });

  res.json({ showSticker: config.showSticker, stickerUrl: config.stickerUrl, shipments });
}

export async function listMyRefundRequestsHandler(req: Request, res: Response) {
  const items = await RefundRequest.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

export async function listSellerRefundRequestsHandler(req: Request, res: Response) {
  const items = await RefundRequest.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

export const resolveRefundSchema = z.object({
  approve: z.boolean(),
  resolutionNote: z.string().optional(),
  // Inspection outcome: by default an approved return is in sellable condition
  // and its units go back to stock. Set false for a damaged/unsellable return.
  restock: z.boolean().default(true),
});

// Refunding credits the customer's wallet and reverses the seller's ledger entry
// for that portion — the same reversal pattern used by order cancellation.
export async function resolveRefundRequestHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const request = await RefundRequest.findById(req.params.id).session(session);
      if (!request) throw new ApiError(404, "Refund request not found");
      // A seller-approved request is still awaiting the admin payout, so both
      // "pending" and "approved" are resolvable here; "refunded"/"rejected" are terminal.
      if (request.status !== "pending" && request.status !== "approved") {
        throw new ApiError(409, "This request has already been resolved");
      }

      if (req.body.approve) {
        const order = await Order.findOne({ _id: request.orderId, userId: request.userId, paymentStatus: "paid" }).session(session);
        const index = order?.details.findIndex((detail) => String(detail.sellerId) === String(request.sellerId)) ?? -1;
        const detail = index >= 0 ? order!.details[index]! : null;
        if (!order || !detail || detail.status !== "delivered") throw new ApiError(409, "These items are no longer eligible for a refund");
        // Recompute from the order, never trusting a stored amount, in case the
        // order changed between request and resolution.
        const breakdown = refundBreakdown(order, index);
        const { fraction } = breakdown;
        request.merchandise = breakdown.merchandise;
        request.tax = breakdown.tax;
        request.discount = breakdown.discount;
        request.amount = breakdown.amount;
        const wallet = await Wallet.findOneAndUpdate(
          { userId: request.userId, currency: order.currency },
          { $inc: { balance: request.amount }, $setOnInsert: { currency: order.currency } },
          { session, new: true, upsert: true },
        );
        await WalletTransaction.create(
          [
            {
              userId: request.userId,
              amount: request.amount,
              balanceAfter: wallet?.balance ?? request.amount,
              reason: "Refund approved",
              refType: "refund",
              refId: request._id,
              idempotencyKey: `refund:${request._id}`,
            },
          ],
          { session },
        );
        if (request.sellerId) await SellerLedger.create([
          { sellerId: request.sellerId, orderId: request.orderId, type: "refund", amount: -breakdown.merchandise, note: "Refund approved" },
          { sellerId: request.sellerId, orderId: request.orderId, type: "commission", amount: round2(detail.commissionAmount * fraction), note: "Refund commission reversal" },
        ], { session, ordered: true });
        const spent = detail.clubPointsSpent ?? allocateUnits(order.clubPointsSpent, order.details.map((line) => line.subtotal))[index]!;
        const points = Math.round(spent * fraction);
        if (points > 0) {
          await ClubPointTransaction.create([{ userId: request.userId, points, orderId: order._id,
            reason: "Refunded order items", idempotencyKey: `refund-points:${request._id}` }], { session });
          await User.updateOne({ _id: request.userId }, { $inc: { clubPoints: points } }, { session });
        }
        await reverseEarnedPointsForShipment(order, index, session, fraction);
        await reverseAffiliateForShipment(order, index, session, breakdown.lineKeys, fraction);
        // Inspection-gated restock: returned units go back to sellable stock only
        // when the resolver confirms they arrived in sellable condition. Rebuilt
        // from the approval-time breakdown so it matches the amount refunded.
        request.lines = breakdown.lines.map((line) => ({ ...line, restocked: req.body.restock })) as never;
        if (req.body.restock) {
          for (const line of breakdown.lines) {
            await Product.updateOne(
              { _id: line.productId, "variants.sku": line.variantSku },
              { $inc: { "variants.$[v].stock": line.quantity } },
              { session, arrayFilters: [{ "v.sku": line.variantSku }] },
            );
            await InventoryMovement.create([{ productId: line.productId, variantSku: line.variantSku,
              type: "restock", quantity: line.quantity, orderId: order._id, note: "Refund restock" }], { session });
          }
        }
        // A shipment is marked refunded only when its entire contents were
        // refundable; a mixed shipment keeps its delivered items and status.
        if (breakdown.fullShipment) {
          detail.status = "refunded";
          if (order.details.every((line) => ["refunded", "cancelled"].includes(line.status))) order.status = "refunded";
        }
        await order.save({ session });
        request.status = "refunded";
      } else {
        request.status = "rejected";
      }
      request.resolutionNote = req.body.resolutionNote;
      request.resolvedBy = req.user!.id as never;
      await request.save({ session });
      result = request;
    });
    res.json(result);
  } finally {
    await session.endSession();
  }
}

const round2 = (value: number) => Math.round(value * 100) / 100;

// Market-standard item return: refund the refundable merchandise, the sales tax
// proportional to it, and the matching share of any order discount — but never
// the outbound shipping. In a mixed shipment the non-refundable items are
// excluded, and every downstream reversal is scaled by `fraction` (the refunded
// share of this seller's merchandise) so a partial return claws back exactly its
// portion of commission, reward points and affiliate earnings.
function refundBreakdown(order: InstanceType<typeof Order>, index: number) {
  const detail = order.details[index]!;
  const refundableItems = detail.items.filter((item) => item.refundable);
  const merchandise = round2(refundableItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const fraction = detail.subtotal > 0 ? Math.min(1, Math.max(0, merchandise / detail.subtotal)) : 0;

  const discountTotal = detail.discount ?? allocateUnits(Math.round(order.discount * 100), order.details.map((line) => line.subtotal))[index]! / 100;
  const taxTotal = detail.tax ?? allocateUnits(Math.round(order.tax * 100), order.details.map((line) => line.subtotal))[index]! / 100;
  const discount = round2(discountTotal * fraction);
  const tax = round2(taxTotal * fraction);
  const amount = Math.max(0, round2(merchandise - discount + tax));

  return {
    merchandise, discount, tax, amount, fraction,
    fullShipment: refundableItems.length === detail.items.length,
    lineKeys: new Set(refundableItems.map((item) => `${item.productId}:${item.variantSku}`)),
    lines: refundableItems.map((item) => ({ productId: item.productId, variantSku: item.variantSku, quantity: item.quantity })),
  };
}

export const sellerRefundDecisionSchema = z.object({
  approve: z.boolean(),
  resolutionNote: z.string().max(1000).optional(),
});

// The seller's recommendation step. It never moves money — it only marks the
// request "approved" so it appears in the admin payout queue (or rejects it
// outright), which keeps disbursement authority with the platform.
export async function sellerDecideRefundHandler(req: Request, res: Response) {
  const request = await RefundRequest.findOne({ _id: req.params.id, sellerId: req.user!.id });
  if (!request) throw new ApiError(404, "Refund request not found");
  if (request.status !== "pending") throw new ApiError(409, "This request has already been reviewed");

  request.status = req.body.approve ? "approved" : "rejected";
  request.resolutionNote = req.body.resolutionNote;
  request.resolvedBy = req.user!.id as never;
  await request.save();
  res.json(request);
}

// --- Admin -------------------------------------------------------------------

export async function listAllRefundRequestsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const items = await RefundRequest.find(status ? { status } : {})
    .populate("userId", "name email")
    .populate("sellerId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

// Already-paid refunds, for the admin's disbursement history view.
export async function listPaidRefundsHandler(_req: Request, res: Response) {
  const items = await RefundRequest.find({ status: "refunded" })
    .populate("userId", "name email")
    .populate("sellerId", "name email")
    .sort({ updatedAt: -1 })
    .limit(200);
  res.json({ items });
}

export const refundConfigSchema = z.object({
  requestWindowDays: z.number().int().min(0).max(365),
  showSticker: z.boolean(),
  stickerUrl: z.string().url().optional().or(z.literal("")),
});

export async function getRefundConfigHandler(_req: Request, res: Response) {
  res.json(await getRefundConfig());
}

export async function updateRefundConfigHandler(req: Request, res: Response) {
  const config = await RefundConfig.findOneAndUpdate({ key: "refund" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json(config);
}
