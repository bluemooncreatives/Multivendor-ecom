import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order.js";
import { PickupPoint } from "../models/Marketing.js";
import { settleOrderPayment } from "../services/payment.service.js";
import { cancelOrder } from "../services/order.service.js";
import { awardClubPointsForOrder } from "../services/clubpoints.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
});

// Admin override of the whole order's fulfillment state, cascading to every
// seller's shipment so the rollup the seller dashboard reads stays consistent.
// Shipments already cancelled or refunded are left alone — those are terminal.
export async function updateOrderStatusHandler(req: Request, res: Response) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "refunded") throw new ApiError(409, "A refunded order cannot change status");

  // Cancelling has side effects (restock, ledger reversal, wallet refund), so it
  // routes through cancelOrder rather than being a plain field write.
  if (req.body.status === "cancelled") {
    return res.json(await cancelOrder(String(order._id), req.user!));
  }

  order.status = req.body.status as never;
  for (const detail of order.details) {
    if (detail.status !== "cancelled" && detail.status !== "refunded") {
      detail.status = req.body.status as never;
      if (req.body.status === "delivered") detail.deliveredAt ??= new Date();
    }
  }
  await order.save();

  if (req.body.status === "delivered") await awardClubPointsForOrder(String(order._id));
  res.json(order);
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
    return res.json(await Order.findById(order._id));
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(409, "A paid order cannot be marked unpaid; issue a refund instead");
  }
  order.paymentStatus = req.body.paymentStatus as never;
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

  const point = await PickupPoint.findById(pickupPointId);
  if (!point) throw new ApiError(404, "Pickup point not found");

  const items = await Order.find({ "addressSnapshot.pickupPointId": pickupPointId })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ pickupPoint: point, items });
}
