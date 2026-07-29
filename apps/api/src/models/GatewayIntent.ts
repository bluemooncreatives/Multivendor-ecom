import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

/**
 * A payable that is not an order.
 *
 * The legacy app wired every gateway four times — once for checkout, once for
 * wallet top-ups, once for seller packages and once for customer packages — which
 * is why several gateways only ever worked for one of them. Here the gateways
 * stay order-shaped and anything else that needs paying becomes one of these, so
 * a gateway added once works for all four purposes.
 */
const gatewayIntentSchema = new Schema(
  {
    purpose: {
      type: String,
      enum: ["wallet_recharge", "seller_package", "customer_package"],
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** The package being bought; null for a wallet top-up, which references nothing. */
    refId: { type: Schema.Types.ObjectId, default: null },
    // Mirrors the Order fields the gateway services read, so one code path covers
    // both without the services needing to know which they were handed.
    code: { type: String, required: true, unique: true },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    addressSnapshot: { type: Schema.Types.Mixed, default: {} },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    /** Set once the purpose has been carried out, so fulfilment runs exactly once. */
    fulfilledAt: { type: Date, default: null },
    providerRef: String,
  },
  { timestamps: true },
);

withJsonId(gatewayIntentSchema);
export const GatewayIntent = model("GatewayIntent", gatewayIntentSchema);
