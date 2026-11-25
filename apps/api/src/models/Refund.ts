import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const refundRequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reason: { type: String, required: true },
    images: { type: [String], default: [] },
    // The refundable items this request covers (non-refundable items in a mixed
    // shipment are excluded). `restocked` records the inspection outcome at
    // resolution: true returns the units to sellable stock, false (damaged) does not.
    lines: {
      type: [new Schema({
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        variantSku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        restocked: { type: Boolean, default: false },
      }, { _id: false })],
      default: [],
    },
    // Breakdown of `amount`: amount = merchandise - discount + tax. Outbound
    // shipping is never refunded on an item return (market-standard policy).
    merchandise: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected", "refunded"], default: "pending" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolutionNote: String,
  },
  { timestamps: true },
);

refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ orderId: 1, sellerId: 1 }, {
  unique: true, partialFilterExpression: { status: { $in: ["pending", "approved", "refunded"] } },
});
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
