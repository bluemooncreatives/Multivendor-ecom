import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

withJsonId(addressSchema);
export const Address = model("Address", addressSchema);

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true },
);

wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
withJsonId(wishlistSchema);
export const Wishlist = model("Wishlist", wishlistSchema);

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    images: { type: [String], default: [] },
    approved: { type: Boolean, default: true },
    sellerReply: String,
  },
  { timestamps: true },
);

// One review per order line, not per product-lifetime, so re-purchases can be re-reviewed.
reviewSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true });
withJsonId(reviewSchema);
export const Review = model("Review", reviewSchema);
