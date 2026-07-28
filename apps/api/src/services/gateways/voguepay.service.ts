import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";

interface VoguePayCreds {
  merchantId: string;
}

// NOTE: VoguePay (Nigeria) ceased operating as a payment processor some years
// ago; this integration is implemented to the same request contract the legacy
// app used, kept for structural parity, but there is no live service left to
// actually process a transaction against — verify with the merchant account
// provider before enabling this in production.
export async function createVoguePaySession(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const creds = await getGatewayCredentials<VoguePayCreds>("voguepay");

  await recordPendingPayment(orderId, "voguepay", order.grandTotal, order.currency, String(order._id));

  const params = new URLSearchParams({
    "v-merchant-id": creds.merchantId,
    memo: `Order ${order.code}`,
    total: String(order.grandTotal),
    currency: order.currency,
    notify_url: `${env.NEXT_PUBLIC_APP_URL}/api/payments/voguepay/notify`,
    v_o_a: "1", // return to store after payment
  });

  return { redirectUrl: `https://voguepay.com/pay/?${params.toString()}` };
}

export async function handleVoguePayNotify(orderId: string, status: string) {
  if (status === "Approved" || status === "success") {
    await paymentService.settleOrderPayment(orderId, "voguepay");
  } else {
    await paymentService.failOrderPayment(orderId, "voguepay");
  }
}
