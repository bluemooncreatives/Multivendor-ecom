import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const refundRequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    images: { type: [String], default: [] },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected", "refunded"], default: "pending" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: String,
  },
  { timestamps: true },
);

refundRequestSchema.index({ status: 1, createdAt: -1 });
withJsonId(refundRequestSchema);
export const RefundRequest = model("RefundRequest", refundRequestSchema);

// Singleton admin configuration for the refund add-on.
const refundConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "refund" },
    // Days after delivery during which a customer may still open a request.
    requestWindowDays: { type: Number, required: true, default: 7, min: 0 },
    // Show the "refundable" sticker on product/order pages.
    showSticker: { type: Boolean, default: true },
    stickerUrl: String,
  },
  { timestamps: true },
);

withJsonId(refundConfigSchema);
export const RefundConfig = model("RefundConfig", refundConfigSchema);
