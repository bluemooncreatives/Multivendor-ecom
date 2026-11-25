import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { ManualPaymentMethod } from "../models/Settings.js";
import * as paymentService from "../services/payment.service.js";
import * as paypalService from "../services/paypal.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import { assertPayable } from "../services/order-state.js";
import { queueOrderSms } from "../services/order-sms.service.js";

export async function listManualPaymentMethodsHandler(_req: Request, res: Response) {
  res.json({ items: await ManualPaymentMethod.find({ active: true }) });
}

export async function listAdminManualPaymentMethodsHandler(_req: Request, res: Response) {
  res.json({ items: await ManualPaymentMethod.find() });
}

export const manualPaymentMethodSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1),
  accountDetails: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
});

export async function createManualPaymentMethodHandler(req: Request, res: Response) {
  res.status(201).json(await ManualPaymentMethod.create(req.body));
}

export async function updateManualPaymentMethodHandler(req: Request, res: Response) {
  const method = await ManualPaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!method) throw new ApiError(404, "Payment method not found");
  res.json(method);
}

async function assertOrderOwnership(orderId: string, req: Request) {
  const guestId = req.header("x-guest-id");
  if (!req.user && !guestId) throw new ApiError(401, "A payment owner is required");
  const filter = req.user ? { _id: orderId, userId: req.user.id } : { _id: orderId, userId: null, guestId };
  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export async function createStripeIntentHandler(req: Request, res: Response) {
  await assertOrderOwnership(String(req.params.orderId), req);
  const result = await paymentService.createStripeIntent(String(req.params.orderId));
  res.json(result);
}

// Hosted Checkout, which the storefront uses — no card data reaches this app.
export async function createStripeCheckoutHandler(req: Request, res: Response) {
  await assertOrderOwnership(String(req.params.orderId), req);
  const result = await paymentService.createStripeCheckoutSession(String(req.params.orderId));
  res.json(result);
}

export async function createRazorpayOrderHandler(req: Request, res: Response) {
  await assertOrderOwnership(String(req.params.orderId), req);
  const result = await paymentService.createRazorpayOrder(String(req.params.orderId));
  res.json(result);
}

export async function createPaypalOrderHandler(req: Request, res: Response) {
  await assertOrderOwnership(String(req.params.orderId), req);
  const result = await paypalService.createPaypalOrder(String(req.params.orderId));
  res.json(result);
}

export const capturePaypalSchema = z.object({ paypalOrderId: z.string() });

export async function capturePaypalOrderHandler(req: Request, res: Response) {
  const order = await assertOrderOwnership(String(req.params.orderId), req);
  const result = await paypalService.capturePaypalOrder(req.body.paypalOrderId, String(order._id));
  if (result.status === "COMPLETED") {
    await paymentService.settleOrderPayment(String(order._id), "paypal", result.id);
  }
  res.json(result);
}

export const submitManualPaymentSchema = z.object({
  methodId: z.string(),
  proofUrl: z.string().url().refine((url) => /^https?:\/\//i.test(url), "Use an HTTP or HTTPS receipt URL"),
});

export async function submitManualPaymentHandler(req: Request, res: Response) {
  const order = await assertOrderOwnership(String(req.params.orderId), req);
  assertPayable(order, "manual");
  const method = await ManualPaymentMethod.findById(req.body.methodId);
  if (!method || !method.active) throw new ApiError(404, "Payment method not available");

  const payment = await Payment.findOneAndUpdate(
    { orderId: order._id, method: "manual" },
    {
      orderId: order._id,
      method: "manual",
      amount: order.grandTotal,
      currency: order.currency,
      status: "pending",
      manualProofUrl: req.body.proofUrl,
      idempotencyKey: `order:${order._id}:manual`,
    },
    { upsert: true, new: true },
  );

  res.status(201).json(payment);
}

export const approveManualPaymentSchema = z.object({
  approved: z.boolean(),
});

// Only a pending receipt can change resolution. Repeating the same decision
// returns its existing result; an opposite decision cannot reopen it.
export async function approveManualPaymentHandler(req: Request, res: Response) {
  const payment = await Payment.findOne({ orderId: req.params.orderId, method: "manual" });
  if (!payment) throw new ApiError(404, "No manual payment found for this order");
  if (payment.status !== "pending") {
    const sameResolution = (req.body.approved && payment.status === "paid") || (!req.body.approved && payment.status === "failed");
    if (!sameResolution) throw new ApiError(409, "This payment has already been resolved");
    const resolved = await Order.findById(payment.orderId);
    if (resolved) await queueOrderSms(resolved, "payment");
    return res.json(payment);
  }

  if (req.body.approved) {
    await paymentService.settleOrderPayment(String(payment.orderId), "manual");
    await Payment.updateOne({ _id: payment._id, status: "paid" }, { manualApprovedBy: req.user!.id });
  } else {
    await paymentService.failOrderPayment(String(payment.orderId), "manual");
  }
  const resolved = await Order.findById(payment.orderId);
  if (resolved) await queueOrderSms(resolved, "payment");

  res.json(await Payment.findById(payment._id));
}

// --- Operations: abandoned checkouts and late captures ------------------------

export const expireAbandonedSchema = z.object({
  /** Minutes a gateway checkout may hold stock. Defaults to the service constant. */
  ttlMinutes: z.coerce.number().int().min(5).max(10080).optional(),
});

export async function expireAbandonedOrdersHandler(req: Request, res: Response) {
  const { ttlMinutes } = expireAbandonedSchema.parse(req.query);
  res.json(await paymentService.expireAbandonedOrders(ttlMinutes));
}

export async function listLateCapturesHandler(_req: Request, res: Response) {
  res.json({ items: await paymentService.listLateCaptures() });
}
