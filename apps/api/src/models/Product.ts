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
    // Null for admin-owned ("In House") listings, which the legacy app modelled
    // with added_by='admin' and no seller row.
    sellerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    addedBy: { type: String, enum: ["admin", "seller"], default: "seller", index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    // The full taxonomy path. categoryId is the deepest node actually chosen and is
    // what search filters on; the two coarser ids are denormalised for the legacy
    // category/sub/sub-sub browse pages and bulk-export columns.
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    subSubCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    thumbnailUrl: { type: String, default: null },
    basePrice: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 }, // cost basis, drives profit reports
    currency: { type: String, default: "INR" },
    unit: { type: String, default: "pc" },
    barcode: { type: String, default: null, index: true }, // POS scan lookup
    // Product-level discount, applied before tax at checkout.
    discount: { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ["flat", "percent"], default: "percent" },
    // Per-product tax overrides the global rate when set (legacy tax/tax_type).
    tax: { type: Number, default: null, min: 0 },
    taxType: { type: String, enum: ["flat", "percent"], default: "percent" },
    // Product-wise shipping, honoured when the store runs in product_wise mode.
    shippingType: { type: String, enum: ["free", "flat_rate"], default: "free" },
    shippingCost: { type: Number, default: 0, min: 0 },
    variants: { type: [variantSchema], required: true, validate: (v: unknown[]) => v.length > 0 },
    // Selectable colours and named option sets that feed the SKU combination
    // generator; persisted so the edit form can re-render the grid it produced.
    colors: { type: [{ type: Schema.Types.ObjectId, ref: "Color" }], default: [] },
    choiceOptions: {
      type: [{ name: { type: String, required: true }, values: { type: [String], default: [] } }],
      default: [],
    },
    minOrderQty: { type: Number, default: 1, min: 1 },
    isDigital: { type: Boolean, default: false },
    digitalFileUrl: { type: String, default: null }, // never served directly; gated by download token
    refundable: { type: Boolean, default: true },
    videoProvider: { type: String, enum: ["youtube", "dailymotion", "vimeo", null], default: null },
    videoLink: { type: String, default: null },
    pdfSpecUrl: { type: String, default: null },
    metaTitle: { type: String, default: null },
    metaDescription: { type: String, default: null },
    metaImageUrl: { type: String, default: null },
    numOfSale: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    featured: { type: Boolean, default: false, index: true },
    todaysDeal: { type: Boolean, default: false, index: true },
    // Club-points earned by the buyer per unit of this product (loyalty add-on).
    clubPoints: { type: Number, default: 0, min: 0 },
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
productSchema.index({ published: 1, approvalStatus: 1, subCategoryId: 1 });
productSchema.index({ published: 1, approvalStatus: 1, subSubCategoryId: 1 });
productSchema.index({ sellerId: 1, published: 1 });

// sellerId is only optional for admin-owned listings; a seller product without an
// owner would escape every sellerId-scoped ownership check in the controllers.
productSchema.pre("validate", function (next) {
  if (this.addedBy === "seller" && !this.sellerId) {
    next(new Error("sellerId is required for seller-owned products"));
    return;
  }
  next();
});

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
