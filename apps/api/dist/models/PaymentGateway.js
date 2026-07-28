import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
// Admin-configurable credentials for the regional gateways (mirrors the legacy
// app's admin "payment method" screen) rather than only env vars — lets an
// admin turn a gateway on/off and rotate its keys without a redeploy.
const paymentGatewaySchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        enum: ["sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius"],
    },
    enabled: { type: Boolean, default: false },
    credentials: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
withJsonId(paymentGatewaySchema);
export const PaymentGateway = model("PaymentGateway", paymentGatewaySchema);
//# sourceMappingURL=PaymentGateway.js.map