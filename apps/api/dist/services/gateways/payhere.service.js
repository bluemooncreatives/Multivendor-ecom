import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
function md5(input) {
    return createHash("md5").update(input).digest("hex").toUpperCase();
}
// Payhere (Sri Lanka) requires an auto-submitting HTML form POST, not a simple
// redirect link — the frontend builds that form from the fields returned here.
export async function createPayhereSession(orderId) {
    const order = await getPendingOrderOrThrow(orderId);
    const creds = await getGatewayCredentials("payhere");
    const addr = order.addressSnapshot;
    const amount = order.grandTotal.toFixed(2);
    const hashedSecret = md5(creds.merchantSecret);
    const hash = md5(`${creds.merchantId}${order._id}${amount}${order.currency}${hashedSecret}`);
    await recordPendingPayment(orderId, "payhere", order.grandTotal, order.currency, String(order._id));
    return {
        actionUrl: creds.sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout",
        fields: {
            merchant_id: creds.merchantId,
            return_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed?code=${order.code}`,
            cancel_url: `${env.NEXT_PUBLIC_APP_URL}/en/checkout`,
            notify_url: `${env.API_PUBLIC_URL}/api/v1/payments/payhere/notify/${order._id}`,
            order_id: String(order._id),
            items: `Order ${order.code}`,
            currency: order.currency,
            amount,
            first_name: addr.line1 ?? "Customer",
            last_name: "",
            email: "customer@example.com",
            phone: addr.phone ?? "",
            address: addr.line1 ?? "",
            city: addr.city ?? "",
            country: addr.country ?? "",
            hash,
        },
    };
}
export async function verifyPayhereNotify(input) {
    const creds = await getGatewayCredentials("payhere");
    const hashedSecret = md5(creds.merchantSecret);
    const localSig = md5(`${input.merchantId}${input.orderId}${input.amount}${input.currency}${input.statusCode}${hashedSecret}`);
    if (localSig !== input.receivedSig) {
        throw new Error("Payhere notify signature mismatch");
    }
    if (input.statusCode === "2") {
        await paymentService.settleOrderPayment(input.orderId, "payhere", input.paymentId);
    }
    else {
        await paymentService.failOrderPayment(input.orderId, "payhere");
    }
}
//# sourceMappingURL=payhere.service.js.map