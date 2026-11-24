import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const paymentSchema = new Schema(
  {
    // Exactly one of these is set: `orderId` for a checkout, `intentId` for a
    // wallet top-up or package purchase (see models/GatewayIntent).
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    intentId: { type: Schema.Types.ObjectId, ref: "GatewayIntent", default: null, index: true },
    method: {
      type: String,
      enum: ["stripe", "razorpay", "paypal", "cod", "wallet", "manual", "sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius", "paytm", "mpesa", "flutterwave", "twocheckout"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ["unpaid", "pending", "paid", "failed", "refunded"], default: "pending" },
    providerRef: String, // Stripe PaymentIntent id / Razorpay order id / PayPal order id
    settlementRef: String,
    callbackTokenHash: { type: String, select: false },
    idempotencyKey: { type: String, required: true, unique: true },
    manualProofUrl: String, // receipt upload for manual/offline payments
    manualApprovedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    failureReason: String,
    // A capture that arrived after its order was closed (abandoned, cancelled or
    // already failed). The money is really at the provider, so the capture is
    // recorded and flagged instead of being discarded with a 409, and an operator
    // refunds it. Nothing is confirmed or fulfilled for such a payment.
    requiresRefund: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

withJsonId(paymentSchema);
export const Payment = model("Payment", paymentSchema);

// Deduplicates gateway webhook deliveries: every inbound event is recorded here
// first (unique on provider+eventId); a second delivery of the same event is a no-op.
const paymentEventSchema = new Schema(
  {
    provider: { type: String, enum: ["stripe", "razorpay", "paypal"], required: true },
    eventId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
withJsonId(paymentEventSchema);
export const PaymentEvent = model("PaymentEvent", paymentEventSchema);

// A provider transaction can fund exactly one local payable. The primary key
// guards callbacks replayed against another order with the same amount.
export const PaymentReceipt = model("PaymentReceipt", new Schema({
  _id: { type: String, required: true },
  payableId: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true }));
