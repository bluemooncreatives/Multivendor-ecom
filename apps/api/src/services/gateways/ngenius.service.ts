import axios from "axios";
import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface NgeniusCreds {
  apiKey: string; // base64 "identity:secret" per N-Genius docs
  outletId: string;
  sandbox?: boolean;
}

function baseUrl(sandbox?: boolean) {
  return sandbox ? "https://api-gateway.sandbox.ngenius-payments.com" : "https://api-gateway.ngenius-payments.com";
}

// N-Genius (Network International, UAE) uses a two-step flow: exchange the API
// key for a short-lived bearer token, then create the order against that outlet.
async function getAccessToken(creds: NgeniusCreds): Promise<string> {
  const { data } = await axios.post(
    `${baseUrl(creds.sandbox)}/identity/auth/access-token`,
    {},
    {
      headers: {
        Authorization: `Basic ${creds.apiKey}`,
        "Content-Type": "application/vnd.ni-identity.v1+json",
      },
    },
  );
  return data.access_token;
}

export async function createNgeniusOrder(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const creds = await getGatewayCredentials<NgeniusCreds>("ngenius");
  const token = await getAccessToken(creds);

  const { data } = await axios.post(
    `${baseUrl(creds.sandbox)}/transactions/outlets/${creds.outletId}/orders`,
    {
      action: "SALE",
      amount: { currencyCode: order.currency, value: Math.round(order.grandTotal * 100) },
      merchantOrderReference: String(order._id),
      merchantAttributes: {
        redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed?code=${order.code}`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.ni-payment.v2+json",
      },
    },
  );

  const paymentUrl = data._links?.payment?.href;
  if (!paymentUrl) throw new ApiError(502, "N-Genius order creation did not return a payment link");

  await recordPendingPayment(orderId, "ngenius", order.grandTotal, order.currency, data.reference);
  return { redirectUrl: paymentUrl as string };
}

export async function confirmNgeniusOrder(reference: string, orderId: string) {
  const creds = await getGatewayCredentials<NgeniusCreds>("ngenius");
  const token = await getAccessToken(creds);

  const { data } = await axios.get(`${baseUrl(creds.sandbox)}/transactions/outlets/${creds.outletId}/orders/${reference}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/vnd.ni-payment.v2+json" },
  });

  if (data.state === "CAPTURED" || data.state === "AUTHORISED") {
    await paymentService.settleOrderPayment(orderId, "ngenius", reference);
  } else {
    await paymentService.failOrderPayment(orderId, "ngenius");
  }
}
