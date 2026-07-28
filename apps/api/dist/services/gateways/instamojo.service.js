import axios from "axios";
import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";
function baseUrl(sandbox) {
    return sandbox ? "https://test.instamojo.com/api/1.1" : "https://www.instamojo.com/api/1.1";
}
export async function createInstamojoRequest(orderId) {
    const order = await getPendingOrderOrThrow(orderId);
    const creds = await getGatewayCredentials("instamojo");
    const addr = order.addressSnapshot;
    const { data } = await axios.post(`${baseUrl(creds.sandbox)}/payment-requests/`, new URLSearchParams({
        purpose: `Order ${order.code}`,
        amount: String(order.grandTotal),
        buyer_name: addr.line1 ?? "Customer",
        phone: addr.phone ?? "",
        redirect_url: `${env.API_PUBLIC_URL}/api/v1/payments/instamojo/redirect/${order._id}`,
        allow_repeated_payments: "false",
    }), { headers: { "X-Api-Key": creds.apiKey, "X-Auth-Token": creds.authToken } });
    if (!data.success)
        throw new ApiError(502, "Instamojo payment request failed");
    await recordPendingPayment(orderId, "instamojo", order.grandTotal, order.currency, data.payment_request.id);
    return { redirectUrl: data.payment_request.longurl };
}
// Re-fetches the payment request from Instamojo's API rather than trusting the
// redirect query params outright (those are client-controlled/spoofable).
export async function confirmInstamojoPayment(paymentRequestId, paymentId, orderId) {
    const creds = await getGatewayCredentials("instamojo");
    const { data } = await axios.get(`${baseUrl(creds.sandbox)}/payment-requests/${paymentRequestId}/${paymentId}/`, {
        headers: { "X-Api-Key": creds.apiKey, "X-Auth-Token": creds.authToken },
    });
    if (data.payment?.status === "Credit") {
        await paymentService.settleOrderPayment(orderId, "instamojo", paymentId);
    }
    else {
        await paymentService.failOrderPayment(orderId, "instamojo");
    }
}
//# sourceMappingURL=instamojo.service.js.map