import { Client, Environment, OrdersController, CheckoutPaymentIntent } from "@paypal/paypal-server-sdk";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
const client = env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET
    ? new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: env.PAYPAL_CLIENT_ID,
            oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
        },
        environment: env.NODE_ENV === "production" ? Environment.Production : Environment.Sandbox,
    })
    : null;
const ordersController = client ? new OrdersController(client) : null;
export async function createPaypalOrder(orderId) {
    if (!ordersController)
        throw new ApiError(503, "PayPal is not configured");
    const order = await Order.findById(orderId);
    if (!order)
        throw new ApiError(404, "Order not found");
    if (order.paymentStatus === "paid")
        throw new ApiError(409, "Order is already paid");
    const { result } = await ordersController.ordersCreate({
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    referenceId: String(order._id),
                    amount: {
                        currencyCode: order.currency,
                        value: order.grandTotal.toFixed(2),
                    },
                },
            ],
        },
    });
    await Payment.create({
        orderId: order._id,
        method: "paypal",
        amount: order.grandTotal,
        currency: order.currency,
        status: "pending",
        providerRef: result.id,
        idempotencyKey: `order:${order._id}:paypal`,
    });
    return { paypalOrderId: result.id };
}
export async function capturePaypalOrder(paypalOrderId) {
    if (!ordersController)
        throw new ApiError(503, "PayPal is not configured");
    const { result } = await ordersController.ordersCapture({ id: paypalOrderId });
    return result;
}
//# sourceMappingURL=paypal.service.js.map