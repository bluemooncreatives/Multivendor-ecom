import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const refundRequestSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    images: { type: [String], default: [] },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected", "refunded"], default: "pending" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: String,
}, { timestamps: true });
withJsonId(refundRequestSchema);
export const RefundRequest = model("RefundRequest", refundRequestSchema);
//# sourceMappingURL=Refund.js.map