import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// Admin-configurable credentials for the regional gateways (mirrors the legacy
// app's admin "payment method" screen) rather than only env vars — lets an
// admin turn a gateway on/off and rotate its keys without a redeploy.
const paymentGatewaySchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "sslcommerz",
        "instamojo",
        "paystack",
        "voguepay",
        "payhere",
        "ngenius",
        "paytm",
        "mpesa",
        "flutterwave",
        "twocheckout",
      ],
    },
    enabled: { type: Boolean, default: false },
    // Most of these offer a test environment; the flag selects which host the
    // service calls, so switching to live is a settings change not a redeploy.
    sandbox: { type: Boolean, default: true },
    // Encrypted at rest by utils/secrets before being written here, and never
    // returned to the browser in plaintext.
    credentials: { type: Schema.Types.Mixed, default: {}, select: false },
  },
  { timestamps: true },
);

withJsonId(paymentGatewaySchema);
export const PaymentGateway = model("PaymentGateway", paymentGatewaySchema);
