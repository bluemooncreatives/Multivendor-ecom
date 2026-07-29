import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { RefundRequest, RefundConfig } from "../models/Refund.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function getRefundConfig() {
  return (await RefundConfig.findOne({ key: "refund" })) ?? (await RefundConfig.create({}));
}

export const refundRequestSchema = z.object({
  orderId: z.string(),
  sellerId: z.string(),
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

  const detail = order.details.find((d) => String(d.sellerId) === req.body.sellerId);
  if (!detail) throw new ApiError(404, "That seller has no items on this order");
  if (detail.status !== "delivered") throw new ApiError(409, "You can request a refund once the items are delivered");

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

  const request = await RefundRequest.create({
    orderId: order._id,
    sellerId: req.body.sellerId,
    userId: req.user!.id,
    reason: req.body.reason,
    images: req.body.images,
    amount: detail.subtotal,
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

  const shipments = order.details.map((detail) => {
    const deadline =
      config.requestWindowDays > 0 && detail.deliveredAt
        ? new Date(detail.deliveredAt.getTime() + config.requestWindowDays * 24 * 60 * 60 * 1000)
        : null;
    return {
      sellerId: String(detail.sellerId),
      amount: detail.subtotal,
      eligible:
        order.paymentStatus === "paid" &&
        detail.status === "delivered" &&
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
        const wallet = await Wallet.findOneAndUpdate(
          { userId: request.userId },
          { $inc: { balance: request.amount } },
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
        await SellerLedger.create(
          [{ sellerId: request.sellerId, orderId: request.orderId, type: "refund", amount: -request.amount, note: "Refund approved" }],
          { session },
        );
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
