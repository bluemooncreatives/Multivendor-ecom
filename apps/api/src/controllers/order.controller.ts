import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import * as checkoutService from "../services/checkout.service.js";
import * as orderService from "../services/order.service.js";
import { streamOrderInvoice } from "../services/invoice.service.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../middleware/errorHandler.js";

const inlineAddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().min(1),
});

export const checkoutSchema = z
  .object({
    addressId: z.string().optional(),
    address: inlineAddressSchema.optional(),
    paymentMethod: z.enum(["stripe", "razorpay", "paypal", "cod", "wallet", "manual", "sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius"]),
    couponCode: z.string().optional(),
    // Client-generated per checkout-attempt key. Retrying the exact same attempt
    // (same key) returns the original order instead of creating a duplicate.
    idempotencyKey: z.string().min(10).optional(),
  })
  .refine((v) => v.addressId || v.address, { message: "An address is required", path: ["address"] });

function ownerFromRequest(req: Request) {
  if (req.user) return { userId: req.user.id };
  const guestId = req.header("x-guest-id");
  if (!guestId) throw new ApiError(400, "Missing X-Guest-Id header for guest checkout");
  return { guestId };
}

export async function checkoutHandler(req: Request, res: Response) {
  const order = await checkoutService.createOrder({
    owner: ownerFromRequest(req),
    addressId: req.body.addressId,
    address: req.body.address,
    paymentMethod: req.body.paymentMethod,
    couponCode: req.body.couponCode,
    idempotencyKey: req.body.idempotencyKey ?? randomUUID(),
  });
  res.status(201).json(order);
}

export async function getOrderHandler(req: Request, res: Response) {
  const order = await orderService.getOrderForRequester(String(req.params.id), req.user!);
  res.json(order);
}

export async function listMyOrdersHandler(req: Request, res: Response) {
  const orders = await orderService.listOrdersForUser(req.user!.id);
  res.json({ items: orders });
}

export async function listSellerOrdersHandler(req: Request, res: Response) {
  const orders = await orderService.listOrdersForSeller(req.user!.id);
  res.json({ items: orders });
}

export async function cancelOrderHandler(req: Request, res: Response) {
  const order = await orderService.cancelOrder(String(req.params.id), req.user!);
  res.json(order);
}

export const trackOrderSchema = z.object({
  code: z.string().min(1),
  phone: z.string().min(1),
});

// No-login order tracking, gated by code+phone together (not code alone) so a
// leaked/guessed order code can't be used to pull up someone else's order.
export async function trackOrderHandler(req: Request, res: Response) {
  const order = await Order.findOne({ code: req.body.code, "addressSnapshot.phone": req.body.phone });
  if (!order) throw new ApiError(404, "No order found matching that code and phone number");
  res.json(order);
}

export async function downloadInvoiceHandler(req: Request, res: Response) {
  const order = await orderService.getOrderForRequester(String(req.params.id), req.user!);
  streamOrderInvoice(order, res);
}
