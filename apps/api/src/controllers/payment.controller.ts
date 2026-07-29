import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { ManualPaymentMethod } from "../models/Settings.js";
import * as paymentService from "../services/payment.service.js";
import * as paypalService from "../services/paypal.service.js";
import { ApiError } from "../middleware/errorHandler.js";

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
  const filter = req.user ? { _id: orderId, userId: req.user.id } : { _id: orderId, guestId: req.header("x-guest-id") };
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
  const result = await paypalService.capturePaypalOrder(req.body.paypalOrderId);
  if (result.status === "COMPLETED") {
    await paymentService.settleOrderPayment(String(order._id), "paypal", result.id);
  }
  res.json(result);
}

export const submitManualPaymentSchema = z.object({
  methodId: z.string(),
  proofUrl: z.string().url(),
});

export async function submitManualPaymentHandler(req: Request, res: Response) {
  const order = await assertOrderOwnership(String(req.params.orderId), req);
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

// Explicit one-way state machine: only a "pending" manual payment can be approved,
// so an already-approved payment can't be re-approved (and double-settle the order).
export async function approveManualPaymentHandler(req: Request, res: Response) {
  const payment = await Payment.findOne({ orderId: req.params.orderId, method: "manual" });
  if (!payment) throw new ApiError(404, "No manual payment found for this order");
  if (payment.status !== "pending") throw new ApiError(409, "This payment has already been resolved");

  if (req.body.approved) {
    payment.status = "paid";
    payment.manualApprovedBy = req.user!.id as never;
    await payment.save();
    await paymentService.settleOrderPayment(String(payment.orderId), "manual");
  } else {
    payment.status = "failed";
    await payment.save();
    await paymentService.failOrderPayment(String(payment.orderId), "manual");
  }

  res.json(payment);
}
