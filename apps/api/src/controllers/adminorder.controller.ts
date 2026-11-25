import type { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { settleOrderPayment, failOrderPayment } from "../services/payment.service.js";
import { cancelOrder } from "../services/order.service.js";
import { awardClubPointsForOrder } from "../services/clubpoints.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import { inventoryStatus } from "../services/order-state.js";
import { getManagedPickupPoint, pickupOrderView } from "../services/pickuppoint.service.js";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

// Admin override of the whole order's fulfillment state, cascading to every
// seller's shipment so the rollup the seller dashboard reads stays consistent.
// Shipments already cancelled or refunded are left alone — those are terminal.
export async function updateOrderStatusHandler(req: Request, res: Response) {
  if (req.body.status === "cancelled") return res.json(await cancelOrder(String(req.params.id), req.user!));
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (order.status === "refunded") throw new ApiError(409, "A refunded order cannot change status");
      if (order.status === "cancelled") throw new ApiError(409, "A cancelled order cannot change status");

      if (req.body.status !== order.status && inventoryStatus(order) !== "confirmed") {
        throw new ApiError(409, "Confirm payment before starting fulfillment");
      }
      const sequence = ["pending", "confirmed", "processing", "shipped", "delivered"];
      if (sequence.indexOf(req.body.status) < sequence.indexOf(order.status)) throw new ApiError(409, "Fulfillment cannot move backwards");

      order.status = req.body.status as never;
      // Flag the change as unseen so the customer's order list can mark it updated.
      order.deliveryViewed = false;
      for (const detail of order.details) {
        if (detail.status !== "cancelled" && detail.status !== "refunded") {
          if (sequence.indexOf(req.body.status) >= sequence.indexOf(detail.status)) detail.status = req.body.status as never;
          if (req.body.status === "delivered") detail.deliveredAt ??= new Date();
        }
      }
      await order.save({ session });

      if (req.body.status === "delivered") await awardClubPointsForOrder(String(order._id), session);
      result = order;
    });
    res.json(result);
  } finally { await session.endSession(); }
}

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["unpaid", "pending", "paid", "failed"]),
});

// Marking an order paid runs the same settlement path as a gateway webhook
// (stock confirmation, seller ledger, affiliate commission) rather than just
// flipping a column — the legacy admin toggle wrote the field and nothing else,
// so manually-marked orders never reached the seller's balance.
export async function updateOrderPaymentStatusHandler(req: Request, res: Response) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (req.body.paymentStatus === "paid") {
    if (order.paymentStatus === "paid") throw new ApiError(409, "Order is already paid");
    await settleOrderPayment(String(order._id), order.paymentMethod);
    await awardClubPointsForOrder(String(order._id));
    return res.json(await Order.findById(order._id));
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(409, "A paid order cannot be marked unpaid; issue a refund instead");
  }
  if (["cancelled", "refunded"].includes(order.status)) throw new ApiError(409, "This order is closed");
  if (req.body.paymentStatus === "failed") {
    await failOrderPayment(String(order._id), order.paymentMethod);
    return res.json(await Order.findById(order._id));
  }
  order.paymentStatus = req.body.paymentStatus as never;
  order.paymentStatusViewed = false;
  await order.save();
  res.json(order);
}

// Orders are never hard-deleted — cancelOrder reverses stock, ledger and wallet
// so the books stay balanced. The legacy destroy() dropped the row outright and
// permanently desynced seller balances from the orders that produced them.
export async function cancelOrderAsAdminHandler(req: Request, res: Response) {
  res.json(await cancelOrder(String(req.params.id), req.user!));
}

// Orders routed to a collection point, for the pickup-point manager's day sheet.
export async function listOrdersByPickupPointHandler(req: Request, res: Response) {
  const { pickupPointId } = req.query as { pickupPointId?: string };
  if (!pickupPointId) throw new ApiError(400, "pickupPointId is required");

  const point = await getManagedPickupPoint(pickupPointId, req.user!);

  // Reads details[].pickupPointId, which checkout now writes. This previously
  // queried addressSnapshot.pickupPointId — a field nothing ever populated, so the
  // day sheet was always empty.
  const items = await Order.find({ "details.pickupPointId": pickupPointId })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ pickupPoint: point, items: items.map((order) => pickupOrderView(order, pickupPointId)) });
}
