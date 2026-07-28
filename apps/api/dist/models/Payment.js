import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const paymentSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    method: {
        type: String,
        enum: ["stripe", "razorpay", "paypal", "cod", "wallet", "manual", "sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius"],
        required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ["unpaid", "pending", "paid", "failed", "refunded"], default: "pending" },
    providerRef: String, // Stripe PaymentIntent id / Razorpay order id / PayPal order id
    idempotencyKey: { type: String, required: true, unique: true },
    manualProofUrl: String, // receipt upload for manual/offline payments
    manualApprovedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    failureReason: String,
}, { timestamps: true });
withJsonId(paymentSchema);
export const Payment = model("Payment", paymentSchema);
// Deduplicates gateway webhook deliveries: every inbound event is recorded here
// first (unique on provider+eventId); a second delivery of the same event is a no-op.
const paymentEventSchema = new Schema({
    provider: { type: String, enum: ["stripe", "razorpay", "paypal"], required: true },
    eventId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date, default: Date.now },
}, { timestamps: true });
paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
withJsonId(paymentEventSchema);
export const PaymentEvent = model("PaymentEvent", paymentEventSchema);
//# sourceMappingURL=Payment.js.map