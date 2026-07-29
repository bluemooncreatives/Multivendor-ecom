import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["flat", "percent"], required: true },
    value: { type: Number, required: true, min: 0 },
    // Legacy's cart_base vs product_base split. `product` coupons discount only
    // the qualifying lines; `cart` coupons discount the whole order.
    scope: { type: String, enum: ["cart", "product"], default: "cart" },
    productIds: { type: [{ type: Schema.Types.ObjectId, ref: "Product" }], default: [] },
    categoryIds: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [] },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    usageLimitTotal: { type: Number, default: null },
    usageLimitPerUser: { type: Number, default: 1 },
    startsAt: Date,
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(couponSchema);
export const Coupon = model("Coupon", couponSchema);

// Guests are identified by guestId, not just userId, so guest checkout can still
// enforce per-user coupon limits (a legacy bug: coupons silently failed for guests).
const couponUsageSchema = new Schema(
  {
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  },
  { timestamps: true },
);

couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ couponId: 1, guestId: 1 });
withJsonId(couponUsageSchema);
export const CouponUsage = model("CouponUsage", couponUsageSchema);
