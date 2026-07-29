import axios from "axios";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getGateway, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface PaytmCreds {
  merchantId: string;
  merchantKey: string;
  website?: string;
  industryType?: string;
}

const HOSTS = {
  sandbox: "https://securegw-stage.paytm.in",
  live: "https://securegw.paytm.in",
};

// Paytm's checksum scheme: SHA-256 of the pipe-joined values plus a 4-character
// salt, then AES-128-CBC encrypted with the merchant key under a fixed IV that
// Paytm publishes. Implemented here rather than pulling in Paytm's SDK, which
// ships as CommonJS around a global-state singleton that does not fit these
// ESM services.
const PAYTM_IV = "@@@@&&&&####$$$$";

function paytmHash(values: string, salt: string): string {
  return createHash("sha256").update(`${values}|${salt}`).digest("hex");
}

function joinValues(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => params[key] ?? "")
    .join("|");
}

export function generateChecksum(params: Record<string, string>, key: string): string {
  const salt = randomBytes(2).toString("hex"); // 4 hex characters
  const payload = `${paytmHash(joinValues(params), salt)}${salt}`;

  const cipher = createCipheriv("aes-128-cbc", key.slice(0, 16), PAYTM_IV);
  return Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]).toString("base64");
}

export function verifyChecksum(params: Record<string, string>, key: string, checksum: string): boolean {
  try {
    const decipher = createDecipheriv("aes-128-cbc", key.slice(0, 16), PAYTM_IV);
    const decoded = Buffer.concat([
      decipher.update(Buffer.from(checksum, "base64")),
      decipher.final(),
    ]).toString("utf8");

    const salt = decoded.slice(-4);
    const expected = paytmHash(joinValues(params), salt);

    // Compared in constant time: this guards a public callback endpoint, and a
    // timing-leaky compare would let an attacker forge a "paid" notification.
    const a = Buffer.from(decoded.slice(0, -4));
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function createPaytmSession(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const { creds, sandbox } = await getGateway<PaytmCreds>("paytm");
  const host = sandbox ? HOSTS.sandbox : HOSTS.live;

  const body = {
    requestType: "Payment",
    mid: creds.merchantId,
    websiteName: creds.website ?? "WEBSTAGING",
    orderId: String(order._id),
    callbackUrl: `${env.API_PUBLIC_URL}/api/v1/payments/paytm/callback/${order._id}`,
    txnAmount: { value: order.grandTotal.toFixed(2), currency: order.currency },
    userInfo: { custId: String(order.userId ?? order.guestId ?? order._id) },
  };

  // The initiate call is signed over the serialised body, using the same
  // checksum scheme as the callback verification below.
  const signature = generateChecksum({ body: JSON.stringify(body) }, creds.merchantKey);

  const { data } = await axios.post(
    `${host}/theia/api/v1/initiateTransaction?mid=${creds.merchantId}&orderId=${order._id}`,
    { body, head: { signature } },
    { headers: { "Content-Type": "application/json" } },
  );

  const token = data?.body?.txnToken;
  if (!token) throw new ApiError(502, `Paytm rejected the transaction: ${data?.body?.resultInfo?.resultMsg ?? "unknown"}`);

  await recordPendingPayment(orderId, "paytm", order.grandTotal, order.currency, String(order._id));

  // Paytm's hosted page is reached by POSTing the token, so the client submits an
  // auto-form rather than following a redirect.
  return {
    actionUrl: `${host}/theia/api/v1/showPaymentPage?mid=${creds.merchantId}&orderId=${order._id}`,
    fields: { mid: creds.merchantId, orderId: String(order._id), txnToken: token },
  };
}

export async function handlePaytmCallback(orderId: string, payload: Record<string, string>) {
  const { creds } = await getGateway<PaytmCreds>("paytm");

  const { CHECKSUMHASH, ...params } = payload;
  // An unsigned or mis-signed callback is treated as a failure, never a payment:
  // this endpoint is public, so the checksum is the only proof it came from Paytm.
  if (!CHECKSUMHASH || !verifyChecksum(params, creds.merchantKey, CHECKSUMHASH)) {
    await paymentService.failOrderPayment(orderId, "paytm");
    throw new ApiError(400, "Invalid Paytm checksum");
  }

  if (params.STATUS === "TXN_SUCCESS") {
    await paymentService.settleOrderPayment(orderId, "paytm", params.TXNID);
  } else {
    await paymentService.failOrderPayment(orderId, "paytm");
  }
}
