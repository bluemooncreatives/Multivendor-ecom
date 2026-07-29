import axios from "axios";
import { env } from "../../config/env.js";
import { getGateway, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

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
  const order = await getPendingOrderOrThrow(orderId);
  const { creds, sandbox } = await getGateway<MpesaCreds>("mpesa");
  const host = sandbox ? HOSTS.sandbox : HOSTS.live;

  const token = await getAccessToken(creds, host);
  const stamp = timestamp();
  const password = Buffer.from(`${creds.shortCode}${creds.passkey}${stamp}`).toString("base64");

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
      CallBackURL: `${env.API_PUBLIC_URL}/api/v1/payments/mpesa/callback/${order._id}`,
      AccountReference: order.code,
      TransactionDesc: `Order ${order.code}`,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (data?.ResponseCode !== "0") {
    throw new ApiError(502, `M-Pesa rejected the request: ${data?.errorMessage ?? data?.ResponseDescription ?? "unknown"}`);
  }

  await recordPendingPayment(orderId, "mpesa", order.grandTotal, order.currency, data.CheckoutRequestID);
  return { checkoutRequestId: data.CheckoutRequestID as string, message: "Check your phone to authorise the payment" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleMpesaCallback(orderId: string, payload: any) {
  const callback = payload?.Body?.stkCallback;

  // ResultCode 0 is the only success; everything else (cancelled, timed out,
  // insufficient funds) fails the order so the stock reservation is released.
  if (callback?.ResultCode === 0) {
    const receipt = (callback.CallbackMetadata?.Item ?? []).find(
      (item: { Name: string; Value?: string }) => item.Name === "MpesaReceiptNumber",
    );
    await paymentService.settleOrderPayment(orderId, "mpesa", receipt?.Value ?? callback.CheckoutRequestID);
  } else {
    await paymentService.failOrderPayment(orderId, "mpesa");
  }
}
