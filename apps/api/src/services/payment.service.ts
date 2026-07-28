import mongoose from "mongoose";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { randomUUID } from "node:crypto";
import { Order } from "../models/Order.js";
import { Payment, PaymentEvent } from "../models/Payment.js";
import { SellerLedger } from "../models/Ledger.js";
import { confirmReservation, releaseReservation, type StockLine } from "./inventory.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

function stockLinesFromOrder(order: InstanceType<typeof Order>): StockLine[] {
  return order.details.flatMap((detail) =>
    detail.items.map((item) => ({
      productId: String(item.productId),
      variantSku: item.variantSku,
      quantity: item.quantity,
    })),
  );
}

// Amount is always recomputed from the order stored server-side — never accepted
// from the client — so a tampered checkout request can't under-charge a gateway.
export async function createStripeIntent(orderId: string) {
  if (!stripe) throw new ApiError(503, "Stripe is not configured");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === "paid") throw new ApiError(409, "Order is already paid");

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.grandTotal * 100),
    currency: order.currency.toLowerCase(),
    metadata: { orderId: String(order._id) },
  });

  await Payment.create({
    orderId: order._id,
    method: "stripe",
    amount: order.grandTotal,
    currency: order.currency,
    status: "pending",
    providerRef: intent.id,
    idempotencyKey: `order:${order._id}:stripe`,
  });

  return { clientSecret: intent.client_secret };
}

export async function createRazorpayOrder(orderId: string) {
  if (!razorpay) throw new ApiError(503, "Razorpay is not configured");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === "paid") throw new ApiError(409, "Order is already paid");

  const rpOrder = await razorpay.orders.create({
    amount: Math.round(order.grandTotal * 100),
    currency: order.currency,
    receipt: String(order._id),
  });

  await Payment.create({
    orderId: order._id,
    method: "razorpay",
    amount: order.grandTotal,
    currency: order.currency,
    status: "pending",
    providerRef: rpOrder.id,
    idempotencyKey: `order:${order._id}:razorpay`,
  });

  return { razorpayOrderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency };
}

// Shared settlement path for every async gateway (Stripe/Razorpay/PayPal webhook,
// or manual-payment admin approval): confirms reservation -> stock, posts seller
// ledger entries, marks the order paid. Idempotent on the order's current status.
export async function settleOrderPayment(orderId: string, method: string, providerRef?: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (order.paymentStatus === "paid") return; // already settled — webhook replay is a no-op

      const lines = stockLinesFromOrder(order);
      await confirmReservation(lines, String(order._id), session);

      for (const detail of order.details) {
        detail.status = "confirmed";
        await SellerLedger.create(
          [
            { sellerId: detail.sellerId, orderId: order._id, type: "sale", amount: detail.subtotal, note: "Order paid" },
            {
              sellerId: detail.sellerId,
              orderId: order._id,
              type: "commission",
              amount: -detail.commissionAmount,
              note: "Platform commission",
            },
          ],
          { session, ordered: true },
        );
      }

      order.paymentStatus = "paid";
      order.status = "confirmed";
      await order.save({ session });

      await Payment.updateOne(
        { orderId: order._id, method },
        { status: "paid", providerRef },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function failOrderPayment(orderId: string, method: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.paymentStatus === "paid") return;

      const lines = stockLinesFromOrder(order);
      await releaseReservation(lines, String(order._id), session);

      order.paymentStatus = "failed";
      order.status = "cancelled";
      await order.save({ session });

      await Payment.updateOne({ orderId: order._id, method }, { status: "failed" }, { session });
    });
  } finally {
    await session.endSession();
  }
}

// Deduplicates webhook deliveries: the unique index on (provider, eventId) makes
// a second delivery of the same event throw E11000, which we treat as "already handled".
export async function recordPaymentEventOnce(provider: "stripe" | "razorpay" | "paypal", eventId: string, payload: unknown) {
  try {
    await PaymentEvent.create({ provider, eventId, payload });
    return true;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) return false;
    throw err;
  }
}

export function newManualPaymentReference() {
  return randomUUID();
}
