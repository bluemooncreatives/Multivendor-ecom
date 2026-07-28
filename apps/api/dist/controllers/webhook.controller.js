import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { recordPaymentEventOnce, settleOrderPayment, failOrderPayment } from "../services/payment.service.js";
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
// Mounted with express.raw() (not express.json()) in server.ts, because Stripe's
// signature check is computed over the exact raw request body bytes.
export async function stripeWebhookHandler(req, res) {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).json({ message: "Stripe webhooks are not configured" });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger.warn("Stripe webhook signature verification failed", err);
        return res.status(400).json({ message: "Invalid signature" });
    }
    const isNew = await recordPaymentEventOnce("stripe", event.id, event);
    if (!isNew)
        return res.status(200).json({ received: true, deduped: true });
    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;
        if (orderId)
            await settleOrderPayment(orderId, "stripe", intent.id);
    }
    else if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;
        if (orderId)
            await failOrderPayment(orderId, "stripe");
    }
    res.status(200).json({ received: true });
}
// Razorpay signs the raw webhook body with HMAC-SHA256 using the webhook secret
// configured in the Razorpay dashboard (separate from the API key secret).
export async function razorpayWebhookHandler(req, res) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
        return res.status(503).json({ message: "Razorpay webhooks are not configured" });
    }
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;
    const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return res.status(400).json({ message: "Invalid signature" });
    }
    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventId = req.headers["x-razorpay-event-id"];
    if (eventId) {
        const isNew = await recordPaymentEventOnce("razorpay", eventId, payload);
        if (!isNew)
            return res.status(200).json({ received: true, deduped: true });
    }
    const orderId = payload.payload?.order?.entity?.receipt;
    const paymentEntity = payload.payload?.payment?.entity;
    if (payload.event === "payment.captured" && orderId) {
        await settleOrderPayment(orderId, "razorpay", paymentEntity?.id);
    }
    else if (payload.event === "payment.failed" && orderId) {
        await failOrderPayment(orderId, "razorpay");
    }
    res.status(200).json({ received: true });
}
// NOTE: full PayPal webhook trust requires calling PayPal's
// /v1/notifications/verify-webhook-signature endpoint with PAYPAL_WEBHOOK_ID
// before acting on the event. That call is not wired up yet — until it is,
// this handler only processes events when PAYPAL_WEBHOOK_ID is set, and it
// still dedupes via PaymentEvent so at least replay/double-processing is safe.
export async function paypalWebhookHandler(req, res) {
    if (!env.PAYPAL_WEBHOOK_ID) {
        return res.status(503).json({ message: "PayPal webhook verification is not configured" });
    }
    const rawBody = req.body;
    const event = JSON.parse(rawBody.toString("utf8"));
    const isNew = await recordPaymentEventOnce("paypal", event.id, event);
    if (!isNew)
        return res.status(200).json({ received: true, deduped: true });
    const orderId = event.resource?.purchase_units?.[0]?.reference_id;
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && orderId) {
        await settleOrderPayment(orderId, "paypal", event.resource?.id);
    }
    else if (event.event_type === "PAYMENT.CAPTURE.DENIED" && orderId) {
        await failOrderPayment(orderId, "paypal");
    }
    res.status(200).json({ received: true });
}
//# sourceMappingURL=webhook.controller.js.map