import axios from "axios";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getGateway, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { Payment } from "../../models/Payment.js";

interface MpesaCreds {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
}

const HOSTS = {
  sandbox: "https://sandbox.safaricom.co.ke",
  live: "https://api.safaricom.co.ke",
};

/** Safaricom timestamps are YYYYMMDDHHmmss in local time. */
function timestamp(): string {
  return new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

async function getAccessToken(creds: MpesaCreds, host: string): Promise<string> {
  const basic = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString("base64");
  const { data } = await axios.get(`${host}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!data?.access_token) throw new ApiError(502, "M-Pesa authentication failed");
  return data.access_token as string;
}

/**
 * STK push: the customer's handset prompts them for their M-Pesa PIN. Nothing is
 * settled here — Safaricom posts the result to the callback below, which is the
 * only place the order is marked paid.
 */
export async function createMpesaStkPush(orderId: string, phone: string) {
  const order = await getPendingOrderOrThrow(orderId, "mpesa");
  if (order.currency !== "KES" || !Number.isInteger(order.grandTotal)) throw new ApiError(400, "M-Pesa requires a whole amount in KES");
  const { creds, sandbox } = await getGateway<MpesaCreds>("mpesa");
  const host = sandbox ? HOSTS.sandbox : HOSTS.live;

  const token = await getAccessToken(creds, host);
  const stamp = timestamp();
  const password = Buffer.from(`${creds.shortCode}${creds.passkey}${stamp}`).toString("base64");
  const callbackToken = randomBytes(32).toString("hex");

  // M-Pesa only accepts whole shillings, and requires the 2547XXXXXXXX form.
  const amount = Math.ceil(order.grandTotal);
  const msisdn = phone.replace(/\D/g, "").replace(/^0/, "254");

  const { data } = await axios.post(
    `${host}/mpesa/stkpush/v1/processrequest`,
    {
      BusinessShortCode: creds.shortCode,
      Password: password,
      Timestamp: stamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: msisdn,
      PartyB: creds.shortCode,
      PhoneNumber: msisdn,
      CallBackURL: `${env.API_PUBLIC_URL}/api/v1/payments/mpesa/callback/${order._id}?token=${callbackToken}`,
      AccountReference: order.code,
      TransactionDesc: `Order ${order.code}`,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (data?.ResponseCode !== "0") {
    throw new ApiError(502, `M-Pesa rejected the request: ${data?.errorMessage ?? data?.ResponseDescription ?? "unknown"}`);
  }

  await recordPendingPayment(orderId, "mpesa", order.grandTotal, order.currency, data.CheckoutRequestID);
  await Payment.updateOne({ $or: [{ orderId }, { intentId: orderId }], method: "mpesa", providerRef: data.CheckoutRequestID },
    { callbackTokenHash: createHash("sha256").update(callbackToken).digest("hex") });
  return { checkoutRequestId: data.CheckoutRequestID as string, message: "Check your phone to authorise the payment" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleMpesaCallback(orderId: string, payload: any, callbackToken: string) {
  const callback = payload?.Body?.stkCallback;
  const payment = await Payment.findOne({ $or: [{ orderId }, { intentId: orderId }], method: "mpesa", providerRef: callback?.CheckoutRequestID }).select("+callbackTokenHash");
  const actual = createHash("sha256").update(callbackToken).digest("hex");
  if (!callbackToken || !payment?.callbackTokenHash || payment.callbackTokenHash.length !== actual.length ||
      !timingSafeEqual(Buffer.from(actual), Buffer.from(payment.callbackTokenHash))) {
    throw new ApiError(401, "Invalid M-Pesa callback token");
  }

  // ResultCode 0 is the only success; everything else (cancelled, timed out,
  // insufficient funds) fails the order so the stock reservation is released.
  if (callback?.ResultCode === 0) {
    const amount = (callback.CallbackMetadata?.Item ?? []).find((item: { Name: string }) => item.Name === "Amount")?.Value;
    if (Number(amount) !== payment.amount) throw new ApiError(409, "M-Pesa amount does not match");
    const receipt = (callback.CallbackMetadata?.Item ?? []).find(
      (item: { Name: string; Value?: string }) => item.Name === "MpesaReceiptNumber",
    );
    await paymentService.settleOrderPayment(orderId, "mpesa", receipt?.Value ?? callback.CheckoutRequestID);
  } else {
    await paymentService.failOrderPayment(orderId, "mpesa");
  }
}
