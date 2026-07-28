import { PaymentGateway } from "../../models/PaymentGateway.js";
import { Order } from "../../models/Order.js";
import { Payment } from "../../models/Payment.js";
import { ApiError } from "../../middleware/errorHandler.js";

export type GatewayCode = "sslcommerz" | "instamojo" | "paystack" | "voguepay" | "payhere" | "ngenius";

export async function getGatewayCredentials<T extends Record<string, unknown>>(code: GatewayCode): Promise<T> {
  const gateway = await PaymentGateway.findOne({ code, enabled: true });
  if (!gateway) throw new ApiError(503, `${code} is not enabled. An admin must configure it first.`);
  return gateway.credentials as T;
}

// Every gateway follows the same shape at the point it's invoked from checkout:
// look up the pending order, and refuse to re-initiate a session for one that's
// already settled (protects against a shopper re-opening a stale payment tab).
export async function getPendingOrderOrThrow(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus === "paid") throw new ApiError(409, "Order is already paid");
  return order;
}

export async function recordPendingPayment(
  orderId: string,
  method: GatewayCode,
  amount: number,
  currency: string,
  providerRef: string,
) {
  await Payment.findOneAndUpdate(
    { orderId, method },
    { orderId, method, amount, currency, status: "pending", providerRef, idempotencyKey: `order:${orderId}:${method}` },
    { upsert: true },
  );
}
