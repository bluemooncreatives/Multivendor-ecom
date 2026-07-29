import axios from "axios";
import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getGateway, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface FlutterwaveCreds {
  publicKey: string;
  secretKey: string;
  /** Shared secret configured in the dashboard, sent as the verif-hash header. */
  webhookHash?: string;
  title?: string;
}

const API = "https://api.flutterwave.com/v3";

export async function createFlutterwavePayment(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const { creds } = await getGateway<FlutterwaveCreds>("flutterwave");

  const { data } = await axios.post(
    `${API}/payments`,
    {
      // The order id is the transaction reference, so the redirect and webhook
      // both resolve back to it without extra state.
      tx_ref: String(order._id),
      amount: order.grandTotal,
      currency: order.currency,
      redirect_url: `${env.API_PUBLIC_URL}/api/v1/payments/flutterwave/callback/${order._id}`,
      customer: {
        email: (order.addressSnapshot as Record<string, string>)?.email ?? "customer@example.com",
        phonenumber: (order.addressSnapshot as Record<string, string>)?.phone,
      },
      customizations: { title: creds.title ?? "Order payment", description: `Order ${order.code}` },
    },
    { headers: { Authorization: `Bearer ${creds.secretKey}` } },
  );

  if (data?.status !== "success") throw new ApiError(502, "Flutterwave payment initialisation failed");

  await recordPendingPayment(orderId, "flutterwave", order.grandTotal, order.currency, String(order._id));
  return { redirectUrl: data.data.link as string };
}

/**
 * The redirect carries a transaction id, which is verified server-to-server
 * before anything is settled — the query string alone is attacker-controllable.
 * The amount and currency are re-checked against the order so a tampered or
 * replayed transaction cannot pay for a more expensive order.
 */
export async function verifyFlutterwaveTransaction(orderId: string, transactionId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const { creds } = await getGateway<FlutterwaveCreds>("flutterwave");

  const { data } = await axios.get(`${API}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${creds.secretKey}` },
  });

  const tx = data?.data;
  const settled =
    data?.status === "success" &&
    tx?.status === "successful" &&
    String(tx?.tx_ref) === String(order._id) &&
    tx?.amount >= order.grandTotal &&
    tx?.currency === order.currency;

  if (settled) {
    await paymentService.settleOrderPayment(orderId, "flutterwave", String(tx.id));
  } else {
    await paymentService.failOrderPayment(orderId, "flutterwave");
  }

  return settled;
}

/** Flutterwave sends a static shared secret rather than a computed signature. */
export async function verifyFlutterwaveWebhookHash(received: string | undefined): Promise<boolean> {
  const { creds } = await getGateway<FlutterwaveCreds>("flutterwave").catch(() => ({ creds: null as FlutterwaveCreds | null }));
  if (!creds?.webhookHash || !received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(creds.webhookHash);
  return a.length === b.length && timingSafeEqual(a, b);
}
