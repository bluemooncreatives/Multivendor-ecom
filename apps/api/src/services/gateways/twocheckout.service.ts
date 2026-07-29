import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { getGateway, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface TwoCheckoutCreds {
  merchantCode: string;
  secretWord: string;
}

const HOSTS = {
  sandbox: "https://sandbox.2checkout.com/checkout/purchase",
  live: "https://www.2checkout.com/checkout/purchase",
};

/**
 * 2Checkout hosts the payment page and is reached by POSTing the order details,
 * so this returns form fields for the client to auto-submit rather than a URL.
 */
export async function createTwoCheckoutSession(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const { creds, sandbox } = await getGateway<TwoCheckoutCreds>("twocheckout");

  await recordPendingPayment(orderId, "twocheckout", order.grandTotal, order.currency, String(order._id));

  const address = (order.addressSnapshot ?? {}) as Record<string, string>;

  return {
    actionUrl: sandbox ? HOSTS.sandbox : HOSTS.live,
    fields: {
      sid: creds.merchantCode,
      mode: "2CO",
      li_0_name: `Order ${order.code}`,
      li_0_price: order.grandTotal.toFixed(2),
      currency_code: order.currency,
      merchant_order_id: String(order._id),
      "x_receipt_link_url": `${env.API_PUBLIC_URL}/api/v1/payments/twocheckout/callback/${order._id}`,
      card_holder_name: address.name ?? "",
      street_address: address.line1 ?? "",
      city: address.city ?? "",
      country: address.country ?? "",
      zip: address.postalCode ?? "",
      phone: address.phone ?? "",
      demo: sandbox ? "Y" : "N",
    },
  };
}

/**
 * 2Checkout signs the return with MD5(secretWord + sid + order_number + total).
 * MD5 is 2Checkout's specification, not a choice — it is only ever used to check
 * this signature, never to store anything.
 */
function expectedHash(secretWord: string, sid: string, orderNumber: string, total: string): string {
  return createHash("md5").update(`${secretWord}${sid}${orderNumber}${total}`).digest("hex").toUpperCase();
}

export async function handleTwoCheckoutCallback(orderId: string, payload: Record<string, string>) {
  const order = await getPendingOrderOrThrow(orderId);
  const { creds, sandbox } = await getGateway<TwoCheckoutCreds>("twocheckout");

  // In demo mode 2Checkout signs with the literal order number "1" rather than
  // the real one, which is the documented sandbox behaviour.
  const orderNumber = sandbox && payload.demo === "Y" ? "1" : payload.order_number;
  const expected = expectedHash(creds.secretWord, creds.merchantCode, orderNumber ?? "", payload.total ?? "");
  const received = (payload.key ?? "").toUpperCase();

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await paymentService.failOrderPayment(orderId, "twocheckout");
    throw new ApiError(400, "Invalid 2Checkout signature");
  }

  // Re-check the amount: a valid signature only proves 2Checkout sent it, not
  // that it paid for this order in full.
  if (Number(payload.total) + 0.01 < order.grandTotal) {
    await paymentService.failOrderPayment(orderId, "twocheckout");
    throw new ApiError(400, "2Checkout reported a smaller amount than the order total");
  }

  if (payload.credit_card_processed === "Y" || sandbox) {
    await paymentService.settleOrderPayment(orderId, "twocheckout", payload.order_number);
  } else {
    await paymentService.failOrderPayment(orderId, "twocheckout");
  }
}
