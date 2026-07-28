import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    name: { type: String, required: true }, // snapshot at purchase time
    attributes: { type: Map, of: String, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // server-computed, never client-trusted
    imageUrl: String,
  },
  { _id: false },
);

// One OrderDetail per seller within a multi-vendor order, so each seller only
// ever sees/manages their own line items and fulfillment status.
const orderDetailSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    cancelledAt: Date,
    deliveredAt: Date,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // UUID-derived, not sequential
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guestId: { type: String, default: null, index: true },
    // Optional: only set when the shopper checked out with a saved Address.
    // Guests (and inline one-off addresses) have no Address record at all —
    // addressSnapshot below is the authoritative shipping address either way.
    addressId: { type: Schema.Types.ObjectId, ref: "Address", default: null },
    addressSnapshot: { type: Schema.Types.Mixed, required: true },
    details: { type: [orderDetailSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    couponCode: { type: String, default: null },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shippingTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 }, // = sum(details.subtotal) - discount + tax + shipping
    currency: { type: String, required: true, default: "INR" },
    paymentMethod: {
      type: String,
      enum: ["stripe", "razorpay", "paypal", "cod", "wallet", "manual"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    // Prevents duplicate order creation from double-submits or client retries;
    // enforced as a unique index, not just an application-level check.
    idempotencyKey: { type: String, required: true, unique: true },
    trackingCode: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "details.sellerId": 1, createdAt: -1 });
withJsonId(orderSchema);

export const Order = model("Order", orderSchema);
