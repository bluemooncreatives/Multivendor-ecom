import mongoose from "mongoose";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { randomUUID } from "node:crypto";
import { Order } from "../models/Order.js";
import { GatewayIntent } from "../models/GatewayIntent.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import {
  SellerPackage,
  SellerPackagePayment,
  CustomerPackage,
  CustomerPackagePayment,
} from "../models/Package.js";
import { Payment, PaymentEvent, PaymentReceipt } from "../models/Payment.js";
import { SellerLedger } from "../models/Ledger.js";
import { confirmReservation, releaseReservation, type StockLine } from "./inventory.service.js";
import { creditAffiliateForOrder, reverseAffiliateForOrder } from "./affiliate.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { assertPayable, inventoryStatus } from "./order-state.js";
import { restorePointsForOrder } from "./clubpoints.service.js";
import { CouponUsage } from "../models/Coupon.js";

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
  assertPayable(order, "stripe");
  const existing = await Payment.findOne({ orderId, method: "stripe" });
  if (existing?.providerRef?.startsWith("cs_")) throw new ApiError(409, "Continue the existing hosted checkout");

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.grandTotal * 100),
    currency: order.currency.toLowerCase(),
    metadata: { orderId: String(order._id) },
  }, { idempotencyKey: `order:${order._id}:stripe-intent` });

  await Payment.findOneAndUpdate({ orderId: order._id, method: "stripe" }, { $setOnInsert: {
    orderId: order._id,
    method: "stripe",
    amount: order.grandTotal,
    currency: order.currency,
    status: "pending",
    providerRef: intent.id,
    idempotencyKey: `order:${order._id}:stripe`,
  } }, { upsert: true });

  return { clientSecret: intent.client_secret };
}

/**
 * Stripe Checkout Session — a hosted payment page the shopper is redirected to.
 *
 * Preferred over mounting Elements in our own checkout: no card data ever touches
 * this application, which keeps PCI scope minimal, and it behaves like the other
 * redirect gateways so the client has one code path for all of them. The webhook
 * remains the authority on settlement; the success URL is only a landing page.
 */
export async function createStripeCheckoutSession(orderId: string) {
  if (!stripe) throw new ApiError(503, "Stripe is not configured");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  assertPayable(order, "stripe");
  const existing = await Payment.findOne({ orderId, method: "stripe" });
  if (existing?.providerRef?.startsWith("pi_")) throw new ApiError(409, "Continue the existing card payment");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // One line for the order total rather than per item: the amount is recomputed
    // from the stored order, and per-line rounding could disagree with grandTotal.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: Math.round(order.grandTotal * 100),
          product_data: { name: `Order ${order.code}` },
        },
      },
    ],
    metadata: { orderId: String(order._id) },
    payment_intent_data: { metadata: { orderId: String(order._id) } },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed?code=${order.code}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout?cancelled=1`,
  }, { idempotencyKey: `order:${order._id}:stripe-checkout` });

  await Payment.findOneAndUpdate(
    { orderId: order._id, method: "stripe" },
    { $setOnInsert: {
      orderId: order._id,
      method: "stripe",
      amount: order.grandTotal,
      currency: order.currency,
      status: "pending",
      providerRef: session.id,
      idempotencyKey: `order:${order._id}:stripe`,
    } },
    { upsert: true },
  );

  return { redirectUrl: session.url as string };
}

export async function createRazorpayOrder(orderId: string) {
  if (!razorpay) throw new ApiError(503, "Razorpay is not configured");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  assertPayable(order, "razorpay");
  const existing = await Payment.findOne({ orderId: order._id, method: "razorpay", status: "pending" });
  if (existing?.providerRef) return { razorpayOrderId: existing.providerRef, amount: Math.round(order.grandTotal * 100), currency: order.currency };

  const rpOrder = await razorpay.orders.create({
    amount: Math.round(order.grandTotal * 100),
    currency: order.currency,
    receipt: String(order._id),
  });

  await Payment.findOneAndUpdate({ orderId: order._id, method: "razorpay" }, {
    orderId: order._id,
    method: "razorpay",
    amount: order.grandTotal,
    currency: order.currency,
    status: "pending",
    providerRef: rpOrder.id,
    idempotencyKey: `order:${order._id}:razorpay`,
  }, { upsert: true });

  return { razorpayOrderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency };
}

// Shared settlement path for every async gateway (Stripe/Razorpay/PayPal webhook,
// or manual-payment admin approval): confirms reservation -> stock, posts seller
// ledger entries, marks the order paid. Idempotent on the order's current status.
/**
 * Settles a non-order payable and carries out what it was bought for: credit the
 * wallet, or activate the package.
 *
 * Fulfilment is guarded on `fulfilledAt` inside the transaction, so a webhook
 * replay (or a callback arriving twice) credits the wallet exactly once.
 */
async function settleGatewayIntent(intentId: string, method: string, providerRef?: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const intent = await GatewayIntent.findOneAndUpdate(
        { _id: intentId, fulfilledAt: null, paymentMethod: method, paymentStatus: { $in: ["pending", "unpaid"] } },
        { paymentStatus: "paid", fulfilledAt: new Date(), providerRef },
        { session, new: true },
      );
      // Already fulfilled — a replayed notification, so there is nothing to do.
      if (!intent) return;
      if (providerRef) await claimReceipt(intentId, method, providerRef, session);

      await Payment.updateOne({ intentId: intent._id, method }, { status: "paid", settlementRef: providerRef }, { session });

      if (intent.purpose === "wallet_recharge") {
        const wallet = await Wallet.findOneAndUpdate(
          { userId: intent.userId },
          { $inc: { balance: intent.grandTotal }, $setOnInsert: { currency: intent.currency } },
          { session, new: true, upsert: true },
        );
        await WalletTransaction.create(
          [
            {
              userId: intent.userId,
              amount: intent.grandTotal,
              balanceAfter: wallet!.balance,
              reason: `Top-up via ${method}`,
              refType: "recharge",
              refId: intent._id,
              idempotencyKey: `intent:${intent._id}:credit`,
            },
          ],
          { session },
        );
        return;
      }

      // Package purchases: record the payment against the package so the
      // subscription becomes active, matching the wallet/manual purchase paths.
      // The two package families are handled separately rather than through one
      // model variable — their documents differ (sellerId vs userId), and the
      // union of two Mongoose models has no callable common signature.
      const startsAt = new Date();

      if (intent.purpose === "seller_package") {
        const pkg = await SellerPackage.findById(intent.refId).session(session);
        if (!pkg) throw new ApiError(404, "That package no longer exists");

        await SellerPackagePayment.create(
          [
            {
              sellerId: intent.userId,
              packageId: pkg._id,
              amount: intent.grandTotal,
              startsAt,
              expiresAt: new Date(startsAt.getTime() + pkg.durationDays * 86_400_000),
              paymentMethod: method,
              status: "paid",
            },
          ],
          { session },
        );
        return;
      }

      const pkg = await CustomerPackage.findById(intent.refId).session(session);
      if (!pkg) throw new ApiError(404, "That package no longer exists");

      await CustomerPackagePayment.create(
        [
          {
            userId: intent.userId,
            packageId: pkg._id,
            amount: intent.grandTotal,
            startsAt,
            expiresAt: new Date(startsAt.getTime() + pkg.durationDays * 86_400_000),
            paymentMethod: method,
            status: "paid",
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

export async function settleOrderPayment(orderId: string, method: string, providerRef?: string) {
  // Wallet top-ups and package purchases arrive here through the same gateway
  // callbacks as orders, so the id may be a GatewayIntent rather than an Order.
  if (await GatewayIntent.exists({ _id: orderId })) {
    await settleGatewayIntent(orderId, method, providerRef);
    return;
  }

  const session = await mongoose.startSession();
  let settled = false;
  try {
    await session.withTransaction(async () => {
      settled = false;
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (order.paymentStatus === "paid") { settled = true; return; }
      assertPayable(order, method);
      if (providerRef) await claimReceipt(orderId, method, providerRef, session);

      const needsConfirmation = inventoryStatus(order) === "reserved";
      if (needsConfirmation) await confirmReservation(stockLinesFromOrder(order), String(order._id), session);

      for (const detail of order.details) {
        if (detail.status === "pending") detail.status = "confirmed";
        if (!needsConfirmation && method !== "cod") continue;
        if (!detail.sellerId) continue; // admin-owned line: no vendor to credit
        await SellerLedger.create(
          [
            ...(method === "cod" ? [] : [{ sellerId: detail.sellerId, orderId: order._id, type: "sale", amount: detail.subtotal, note: "Order paid" }]),
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
      order.inventoryStatus = "confirmed";
      order.paymentStatusViewed = false;
      if (order.status === "pending") order.status = "confirmed";
      await order.save({ session });

      await Payment.updateOne(
        { orderId: order._id, method },
        { status: "paid", settlementRef: providerRef },
        { session },
      );
      settled = true;
    });
  } finally {
    await session.endSession();
  }

  // Referral commission runs after the payment transaction commits (it opens its
  // own transaction) and only on the settling call, so webhook replays don't re-credit.
  if (settled) {
    await creditAffiliateForOrder(orderId);
  }
}

export async function failOrderPayment(orderId: string, method: string) {
  if (await GatewayIntent.exists({ _id: orderId })) {
    // Nothing to unwind: an intent holds no stock and grants nothing until it is
    // fulfilled, so failing it is just a status write.
    await GatewayIntent.updateOne(
      { _id: orderId, paymentMethod: method, fulfilledAt: null, paymentStatus: { $in: ["pending", "unpaid"] } },
      { paymentStatus: "failed" },
    );
    return;
  }

  const session = await mongoose.startSession();
  let failed = false;
  try {
    await session.withTransaction(async () => {
      failed = false;
      const order = await Order.findById(orderId).session(session);
      if (!order || order.paymentStatus === "paid" || order.paymentMethod !== method) return;
      if (["cancelled", "refunded"].includes(order.status) || inventoryStatus(order) !== "reserved") return;

      const lines = stockLinesFromOrder(order);
      await releaseReservation(lines, String(order._id), session);

      order.paymentStatus = "failed";
      order.status = "cancelled";
      order.inventoryStatus = "released";
      for (const detail of order.details) { detail.status = "cancelled"; detail.cancelledAt = new Date(); }
      await order.save({ session });
      await restorePointsForOrder(String(order._id), session);
      await CouponUsage.deleteMany({ orderId: order._id }).session(session);

      await Payment.updateOne({ orderId: order._id, method }, { status: "failed" }, { session });
      failed = true;
    });
  } finally {
    await session.endSession();
  }

  if (failed) await reverseAffiliateForOrder(orderId);
}

// A recorded but unfinished delivery stays retryable. The handlers mark it
// complete only after settlement succeeds; each settlement is itself idempotent.
export async function recordPaymentEventOnce(provider: "stripe" | "razorpay" | "paypal", eventId: string, payload: unknown) {
  try {
    await PaymentEvent.create({ provider, eventId, payload, processedAt: null });
    return true;
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      const event = await PaymentEvent.findOne({ provider, eventId });
      return !event?.processedAt;
    }
    throw err;
  }
}

export function newManualPaymentReference() {
  return randomUUID();
}

export async function completePaymentEvent(provider: string, eventId: string) {
  await PaymentEvent.updateOne({ provider, eventId }, { processedAt: new Date() });
}

async function claimReceipt(payableId: string, method: string, reference: string, session: mongoose.ClientSession) {
  const key = `${method}:${reference}`;
  const receipt = await PaymentReceipt.findById(key).session(session);
  if (receipt) {
    if (String(receipt.payableId) !== payableId) throw new ApiError(409, "This provider transaction has already paid another order");
    return;
  }
  await PaymentReceipt.create([{ _id: key, payableId }], { session });
}
