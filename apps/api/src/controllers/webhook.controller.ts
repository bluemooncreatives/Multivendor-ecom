import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { recordPaymentEventOnce, completePaymentEvent, settleOrderPayment, failOrderPayment } from "../services/payment.service.js";
import { verifyPaypalWebhook } from "../services/paypal.service.js";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../middleware/errorHandler.js";

async function assertOrderAmount(orderId: string, method: string, amount: number, currency: string) {
  const order = await Order.findById(orderId);
  if (!order || order.paymentMethod !== method || !Number.isFinite(amount) ||
      Math.round(order.grandTotal * 100) !== amount || order.currency.toUpperCase() !== currency?.toUpperCase()) {
    throw new ApiError(409, "Payment amount, currency or order does not match");
  }
}

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

// Mounted with express.raw() (not express.json()) in server.ts, because Stripe's
// signature check is computed over the exact raw request body bytes.
export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Stripe webhooks are not configured" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"] as string, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn("Stripe webhook signature verification failed", err);
    return res.status(400).json({ message: "Invalid signature" });
  }

  const isNew = await recordPaymentEventOnce("stripe", event.id, event);
  if (!isNew) return res.status(200).json({ received: true, deduped: true });

  // Checkout Sessions and raw PaymentIntents both carry the order id in metadata;
  // settleOrderPayment is idempotent, so receiving both for one payment is safe.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      await assertOrderAmount(orderId, "stripe", session.amount_total ?? NaN, session.currency ?? "");
      await settleOrderPayment(orderId, "stripe", String(session.payment_intent ?? session.id));
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) await failOrderPayment(orderId, "stripe");
  } else if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.orderId;
    if (orderId) {
      await assertOrderAmount(orderId, "stripe", intent.amount_received, intent.currency);
      await settleOrderPayment(orderId, "stripe", intent.id);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.orderId;
    if (orderId) await failOrderPayment(orderId, "stripe");
  }

  await completePaymentEvent("stripe", event.id);
  res.status(200).json({ received: true });
}

// Razorpay signs the raw webhook body with HMAC-SHA256 using the webhook secret
// configured in the Razorpay dashboard (separate from the API key secret).
export async function razorpayWebhookHandler(req: Request, res: Response) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Razorpay webhooks are not configured" });
  }

  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const rawBody: Buffer = req.body;
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");

  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  const eventId = req.headers["x-razorpay-event-id"] as string | undefined;
  if (eventId) {
    const isNew = await recordPaymentEventOnce("razorpay", eventId, payload);
    if (!isNew) return res.status(200).json({ received: true, deduped: true });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const payment = paymentEntity?.order_id ? await Payment.findOne({ method: "razorpay", providerRef: paymentEntity.order_id }) : null;
  const orderId = payment?.orderId ? String(payment.orderId) : undefined;

  if (payload.event === "payment.captured" && orderId) {
    await assertOrderAmount(orderId, "razorpay", paymentEntity.amount, paymentEntity.currency);
    await settleOrderPayment(orderId, "razorpay", paymentEntity?.id);
  } else if (payload.event === "payment.failed" && orderId) {
    await failOrderPayment(orderId, "razorpay");
  }

  if (eventId) await completePaymentEvent("razorpay", eventId);
  res.status(200).json({ received: true });
}

export async function paypalWebhookHandler(req: Request, res: Response) {
  if (!env.PAYPAL_WEBHOOK_ID) {
    return res.status(503).json({ message: "PayPal webhook verification is not configured" });
  }

  const rawBody: Buffer = req.body;
  const event = JSON.parse(rawBody.toString("utf8"));
  if (!(await verifyPaypalWebhook(req, event))) return res.status(400).json({ message: "Invalid signature" });
  const isNew = await recordPaymentEventOnce("paypal", event.id, event);
  if (!isNew) return res.status(200).json({ received: true, deduped: true });

  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  const payment = paypalOrderId ? await Payment.findOne({ method: "paypal", providerRef: paypalOrderId }) : null;
  const orderId = payment?.orderId ? String(payment.orderId) : undefined;

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && orderId) {
    await assertOrderAmount(orderId, "paypal", Math.round(Number(event.resource?.amount?.value) * 100), event.resource?.amount?.currency_code);
    await settleOrderPayment(orderId, "paypal", event.resource?.id);
  } else if (event.event_type === "PAYMENT.CAPTURE.DENIED" && orderId) {
    await failOrderPayment(orderId, "paypal");
  }

  await completePaymentEvent("paypal", event.id);
  res.status(200).json({ received: true });
}
