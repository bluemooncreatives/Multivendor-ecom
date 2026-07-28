import { z } from "zod";
import { PaymentGateway } from "../models/PaymentGateway.js";
import * as sslcommerz from "../services/gateways/sslcommerz.service.js";
import * as instamojo from "../services/gateways/instamojo.service.js";
import * as paystack from "../services/gateways/paystack.service.js";
import * as voguepay from "../services/gateways/voguepay.service.js";
import * as payhere from "../services/gateways/payhere.service.js";
import * as ngenius from "../services/gateways/ngenius.service.js";
import * as paymentService from "../services/payment.service.js";
import { ApiError } from "../middleware/errorHandler.js";
// --- Session/order creation (called from the checkout UI) --------------------
export async function createSslcommerzSessionHandler(req, res) {
    res.json(await sslcommerz.createSslcommerzSession(String(req.params.orderId)));
}
export async function createInstamojoRequestHandler(req, res) {
    res.json(await instamojo.createInstamojoRequest(String(req.params.orderId)));
}
export async function createPaystackTransactionHandler(req, res) {
    res.json(await paystack.createPaystackTransaction(String(req.params.orderId)));
}
export async function createVoguePaySessionHandler(req, res) {
    res.json(await voguepay.createVoguePaySession(String(req.params.orderId)));
}
export async function createPayhereSessionHandler(req, res) {
    res.json(await payhere.createPayhereSession(String(req.params.orderId)));
}
export async function createNgeniusOrderHandler(req, res) {
    res.json(await ngenius.createNgeniusOrder(String(req.params.orderId)));
}
// --- Callbacks (hit by the gateway itself, not the frontend) ------------------
export async function sslcommerzSuccessHandler(req, res) {
    await sslcommerz.validateSslcommerzPayment(String(req.body.val_id), String(req.params.orderId));
    res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed?code=${req.body.tran_id}`);
}
export async function sslcommerzFailOrCancelHandler(req, res) {
    await paymentService.failOrderPayment(String(req.params.orderId), "sslcommerz");
    res.redirect(`${req.protocol}://${req.get("host")}/en/checkout`);
}
export async function sslcommerzIpnHandler(req, res) {
    await sslcommerz.validateSslcommerzPayment(String(req.body.val_id), String(req.params.orderId));
    res.status(200).send("OK");
}
export async function instamojoRedirectHandler(req, res) {
    const { payment_request_id, payment_id } = req.query;
    if (payment_request_id && payment_id) {
        await instamojo.confirmInstamojoPayment(payment_request_id, payment_id, String(req.params.orderId));
    }
    res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed`);
}
export async function paystackCallbackHandler(req, res) {
    const reference = String(req.query.reference ?? req.params.orderId);
    await paystack.verifyPaystackTransaction(reference, String(req.params.orderId));
    res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed`);
}
export const voguePayNotifySchema = z.object({ transaction_id: z.string().optional(), status: z.string() });
export async function voguePayNotifyHandler(req, res) {
    await voguepay.handleVoguePayNotify(String(req.params.orderId), String(req.body.status));
    res.status(200).send("OK");
}
export async function payhereNotifyHandler(req, res) {
    await payhere.verifyPayhereNotify({
        orderId: String(req.params.orderId),
        paymentId: String(req.body.payment_id),
        amount: String(req.body.payhere_amount),
        currency: String(req.body.payhere_currency),
        statusCode: String(req.body.status_code),
        merchantId: String(req.body.merchant_id),
        receivedSig: String(req.body.md5sig),
    });
    res.status(200).send("OK");
}
export const confirmNgeniusSchema = z.object({ reference: z.string() });
export async function confirmNgeniusHandler(req, res) {
    await ngenius.confirmNgeniusOrder(req.body.reference, String(req.params.orderId));
    res.status(204).send();
}
// --- Admin gateway credential management --------------------------------------
export const gatewayConfigSchema = z.object({
    enabled: z.boolean().optional(),
    credentials: z.record(z.unknown()).optional(),
});
export async function listGatewayConfigsHandler(_req, res) {
    res.json({ items: await PaymentGateway.find() });
}
export async function upsertGatewayConfigHandler(req, res) {
    const code = req.params.code;
    const allowed = ["sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius"];
    if (!allowed.includes(String(code)))
        throw new ApiError(404, "Unknown gateway");
    const gateway = await PaymentGateway.findOneAndUpdate({ code }, { code, ...req.body }, { upsert: true, new: true });
    res.json(gateway);
}
//# sourceMappingURL=extragateway.controller.js.map