import { PaymentGateway } from "../../models/PaymentGateway.js";
import { Order } from "../../models/Order.js";
import { GatewayIntent } from "../../models/GatewayIntent.js";
import { Payment } from "../../models/Payment.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { decryptSecret } from "../../utils/secrets.js";
import { assertPayable } from "../order-state.js";

export type GatewayCode =
  | "sslcommerz"
  | "instamojo"
  | "paystack"
  | "voguepay"
  | "payhere"
  | "ngenius"
  | "paytm"
  | "mpesa"
  | "flutterwave"
  | "twocheckout";

/**
 * Decrypted credentials plus the sandbox flag. `credentials` is `select: false`,
 * so it has to be requested explicitly — that is what stops a careless
 * `PaymentGateway.find()` in an admin list endpoint from leaking live keys.
 */
export async function getGateway<T>(code: GatewayCode): Promise<{ creds: T; sandbox: boolean }> {
  const gateway = await PaymentGateway.findOne({ code, enabled: true }).select("+credentials");
  if (!gateway) throw new ApiError(503, `${code} is not enabled. An admin must configure it first.`);

  const stored = (gateway.credentials ?? {}) as Record<string, unknown>;
  const creds: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(stored)) {
    creds[field] = typeof value === "string" ? decryptSecret(value) : value;
  }

  return { creds: creds as T, sandbox: gateway.sandbox };
}

export async function getGatewayCredentials<T>(code: GatewayCode): Promise<T> {
  const { creds, sandbox } = await getGateway<T>(code);
  return { ...creds, sandbox };
}

/**
 * Every gateway follows the same shape at the point it is invoked: look up the
 * pending payable and refuse to re-initiate a session for one already settled
 * (which protects against a shopper re-opening a stale payment tab).
 *
 * A payable is either an Order or a GatewayIntent — wallet top-ups and package
 * purchases are the latter. The two expose the same fields the gateway services
 * read, so no service needs to know which it was handed.
 */
export async function getPendingOrderOrThrow(payableId: string, method?: GatewayCode) {
  const order = await Order.findById(payableId);
  if (order) {
    assertPayable(order, method);
    return order as unknown as PayableLike;
  }

  const intent = await GatewayIntent.findById(payableId);
  if (!intent) throw new ApiError(404, "Payment not found");
  if (!["pending", "unpaid"].includes(intent.paymentStatus)) throw new ApiError(409, "This payment is closed");
  if (method && intent.paymentMethod !== method) throw new ApiError(409, "Payment method does not match");
  return intent as unknown as PayableLike;
}

// Call only with values obtained from the provider's authenticated verification
// response, never directly with an incoming callback's amount/status fields.
export async function assertVerifiedPayment(payableId: string, method: GatewayCode, amount: number, currency: string, providerRef?: string) {
  const payable = await Order.findById(payableId) ?? await GatewayIntent.findById(payableId);
  if (!payable || payable.paymentMethod !== method || !Number.isFinite(amount) ||
      Math.round(payable.grandTotal * 100) !== Math.round(amount * 100) || payable.currency !== currency?.toUpperCase()) {
    throw new ApiError(409, "Verified payment does not match the order amount or currency");
  }
  if (providerRef && !await Payment.exists({ $or: [{ orderId: payableId }, { intentId: payableId }], method, providerRef })) {
    throw new ApiError(409, "Verified payment does not belong to this order");
  }
}

/** The subset of an Order that the gateway services actually read. */
export interface PayableLike {
  _id: unknown;
  code: string;
  currency: string;
  grandTotal: number;
  userId?: unknown;
  guestId?: string | null;
  addressSnapshot?: unknown;
}

export async function recordPendingPayment(
  payableId: string,
  method: GatewayCode,
  amount: number,
  currency: string,
  providerRef: string,
) {
  // The payable is whichever collection it came from; recording it under the
  // right field keeps the Payment row joinable in both directions.
  const isOrder = Boolean(await Order.exists({ _id: payableId }));
  const ownership = isOrder ? { orderId: payableId, intentId: null } : { orderId: null, intentId: payableId };

  await Payment.findOneAndUpdate(
    { ...(isOrder ? { orderId: payableId } : { intentId: payableId }), method, status: { $nin: ["paid", "refunded"] } },
    { $set: { providerRef }, $setOnInsert: {
      ...ownership,
      method,
      amount,
      currency,
      status: "pending",
      idempotencyKey: `payable:${payableId}:${method}`,
    } },
    { upsert: true },
  );
}
