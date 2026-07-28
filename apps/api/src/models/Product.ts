import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// Variants are embedded (replaces the legacy separate `product_stocks` table);
// stock lives per-variant so reservation/confirmation can target one SKU atomically.
const variantSchema = new Schema(
  {
    sku: { type: String, required: true },
    attributes: { type: Map, of: String, default: {} }, // { color: "red", size: "M" }
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reserved: { type: Number, required: true, min: 0, default: 0 }, // pending-order holds
    imageUrl: String,
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    variants: { type: [variantSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    minOrderQty: { type: Number, default: 1, min: 1 },
    isDigital: { type: Boolean, default: false },
    digitalFileUrl: { type: String, default: null }, // never served directly; gated by download token
    published: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    tags: { type: [String], default: [], index: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", tags: "text", description: "text" });
productSchema.index({ published: 1, approvalStatus: 1, categoryId: 1 });
productSchema.index({ sellerId: 1, published: 1 });

withJsonId(productSchema);
export const Product = model("Product", productSchema);

const flashDealSchema = new Schema(
  {
    title: { type: String, required: true },
    bannerUrl: String,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        variantSku: { type: String, required: true },
        discountPercent: { type: Number, required: true, min: 0, max: 90 },
        dealStock: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true },
);

flashDealSchema.index({ active: 1, startsAt: 1, endsAt: 1 });
withJsonId(flashDealSchema);
export const FlashDeal = model("FlashDeal", flashDealSchema);
