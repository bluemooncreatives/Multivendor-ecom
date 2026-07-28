import axios from "axios";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface PaystackCreds {
  secretKey: string;
  publicKey: string;
}

export async function createPaystackTransaction(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const creds = await getGatewayCredentials<PaystackCreds>("paystack");

  const { data } = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: "customer@example.com",
      amount: Math.round(order.grandTotal * 100), // kobo
      reference: String(order._id),
      currency: order.currency,
      callback_url: `${env.API_PUBLIC_URL}/api/v1/payments/paystack/callback/${order._id}`,
    },
    { headers: { Authorization: `Bearer ${creds.secretKey}` } },
  );

  if (!data.status) throw new ApiError(502, "PayStack transaction initialization failed");
  await recordPendingPayment(orderId, "paystack", order.grandTotal, order.currency, data.data.reference);
  return { redirectUrl: data.data.authorization_url as string };
}

export async function verifyPaystackTransaction(reference: string, orderId: string) {
  const creds = await getGatewayCredentials<PaystackCreds>("paystack");
  const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${creds.secretKey}` },
  });

  if (data.data?.status === "success") {
    await paymentService.settleOrderPayment(orderId, "paystack", reference);
  } else {
    await paymentService.failOrderPayment(orderId, "paystack");
  }
}

// PayStack signs webhook bodies with HMAC-SHA512 of the raw payload using the
// secret key — verified the same way as the Stripe/Razorpay webhooks.
export async function verifyPaystackWebhookSignature(rawBody: Buffer, signature: string | undefined): Promise<boolean> {
  const creds = await getGatewayCredentials<PaystackCreds>("paystack").catch(() => null);
  if (!creds || !signature) return false;
  const expected = createHmac("sha512", creds.secretKey).update(rawBody).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
