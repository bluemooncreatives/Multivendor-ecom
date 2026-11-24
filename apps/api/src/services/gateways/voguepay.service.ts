import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment, assertVerifiedPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import axios from "axios";
import { ApiError } from "../../middleware/errorHandler.js";

interface VoguePayCreds {
  merchantId: string;
  email: string;
}

export async function createVoguePaySession(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId, "voguepay");
  const creds = await getGatewayCredentials<VoguePayCreds>("voguepay");

  await recordPendingPayment(orderId, "voguepay", order.grandTotal, order.currency, String(order._id));

  const params = new URLSearchParams({
    p: "linkToken",
    v_merchant_id: creds.merchantId,
    merchant_ref: orderId,
    email: creds.email,
    memo: `Order ${order.code}`,
    total: String(order.grandTotal),
    cur: order.currency,
    notify_url: `${env.API_PUBLIC_URL}/api/v1/payments/voguepay/notify/${order._id}`,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed?code=${order.code}`,
    fail_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout?failed=1`,
  });

  const { data } = await axios.post("https://pay.voguepay.com", params, { timeout: 15_000 });
  const link = typeof data === "string" ? data.trim() : data?.link;
  if (typeof link !== "string" || !/^https:\/\/([\w-]+\.)?voguepay\.com\//.test(link)) {
    throw new ApiError(502, "VoguePay did not return a payment link");
  }
  return { redirectUrl: link };
}

export async function handleVoguePayNotify(orderId: string, transactionId: string) {
  if (!transactionId) throw new ApiError(400, "A transaction id is required");
  const creds = await getGatewayCredentials<VoguePayCreds>("voguepay");
  const { data } = await axios.get("https://pay.voguepay.com", {
    params: { v_transaction_id: transactionId, type: "json", v_merchant_id: creds.merchantId }, timeout: 15_000,
  });
  if (data.merchant_id !== creds.merchantId || data.merchant_ref !== orderId || data.transaction_id !== transactionId) {
    throw new ApiError(409, "VoguePay transaction does not belong to this order");
  }
  await assertVerifiedPayment(orderId, "voguepay", Number(data.total), data.cur);
  if (data.status === "Approved") await paymentService.settleOrderPayment(orderId, "voguepay", transactionId);
}
