import { Client, Environment, OrdersController, CheckoutPaymentIntent } from "@paypal/paypal-server-sdk";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import axios from "axios";
import type { Request } from "express";
import { assertPayable } from "./order-state.js";

const client =
  env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET
    ? new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
        },
        environment: env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
      })
    : null;

const ordersController = client ? new OrdersController(client) : null;

export async function createPaypalOrder(orderId: string) {
  if (!ordersController) throw new ApiError(503, "PayPal is not configured");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  assertPayable(order, "paypal");
  const pending = await Payment.findOne({ orderId: order._id, method: "paypal", status: "pending" });
  if (pending?.providerRef) return { paypalOrderId: pending.providerRef };

  const { result } = await ordersController.ordersCreate({
    paypalRequestId: `order:${order._id}`,
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: String(order._id),
          amount: {
            currencyCode: order.currency,
            value: order.grandTotal.toFixed(2),
          },
        },
      ],
    },
  });

  await Payment.findOneAndUpdate({ orderId: order._id, method: "paypal" }, { $setOnInsert: {
    orderId: order._id,
    method: "paypal",
    amount: order.grandTotal,
    currency: order.currency,
    status: "pending",
    providerRef: result.id,
    idempotencyKey: `order:${order._id}:paypal`,
  } }, { upsert: true });

  return { paypalOrderId: result.id };
}

export async function capturePaypalOrder(paypalOrderId: string, orderId: string) {
  if (!ordersController) throw new ApiError(503, "PayPal is not configured");
  const payment = await Payment.findOne({ orderId, method: "paypal", providerRef: paypalOrderId });
  if (!payment) throw new ApiError(409, "PayPal payment does not belong to this order");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === "paid") return { id: paypalOrderId, status: "COMPLETED" };
  assertPayable(order, "paypal");
  const { result } = await ordersController.ordersCapture({ id: paypalOrderId, paypalRequestId: `capture:${orderId}` });
  if (result.status === "COMPLETED") {
    const units = result.purchaseUnits ?? [];
    const captures = units.flatMap((unit) => unit.payments?.captures ?? []);
    const total = captures.reduce((sum, capture) => sum + Math.round(Number(capture.amount?.value) * 100), 0);
    if (units.length !== 1 || units[0]?.referenceId !== orderId || captures.length === 0 ||
        captures.some((capture) => capture.status !== "COMPLETED" || capture.amount?.currencyCode !== order.currency) ||
        total !== Math.round(order.grandTotal * 100)) {
      throw new ApiError(409, "PayPal capture does not match the order total");
    }
  }
  return result;
}

// Verification contract: https://developer.paypal.com/api/webhooks/v1/
export async function verifyPaypalWebhook(req: Request, event: unknown): Promise<boolean> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET || !env.PAYPAL_WEBHOOK_ID) return false;
  const fields: Record<string, string> = {
    auth_algo: "paypal-auth-algo", cert_url: "paypal-cert-url", transmission_id: "paypal-transmission-id",
    transmission_sig: "paypal-transmission-sig", transmission_time: "paypal-transmission-time",
  };
  const headers: Record<string, string> = {};
  for (const [field, header] of Object.entries(fields)) {
    const value = req.header(header);
    if (!value) return false;
    headers[field] = value;
  }
  const base = env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const { data: token } = await axios.post(`${base}/v1/oauth2/token`, new URLSearchParams({ grant_type: "client_credentials" }), {
    auth: { username: env.PAYPAL_CLIENT_ID, password: env.PAYPAL_CLIENT_SECRET }, timeout: 15_000,
  });
  const { data } = await axios.post(`${base}/v1/notifications/verify-webhook-signature`, {
    ...headers, webhook_id: env.PAYPAL_WEBHOOK_ID, webhook_event: event,
  }, { headers: { Authorization: `Bearer ${token.access_token}` }, timeout: 15_000 });
  return data.verification_status === "SUCCESS";
}
