import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// OLX-style classified listing posted directly by a customer (not a seller SKU).
const customerProductSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    // Same three-level taxonomy as the main catalog; categoryId holds the deepest
    // node chosen and is what browse filters match on.
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    subSubCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    condition: { type: String, enum: ["new", "used"], default: "used" },
    unit: { type: String, default: "pc" },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    thumbnailUrl: String,
    videoProvider: { type: String, enum: ["youtube", "dailymotion", "vimeo", null], default: null },
    videoLink: String,
    metaTitle: String,
    metaDescription: String,
    metaImageUrl: String,
    location: String,
    contactPhone: String,
    status: { type: String, enum: ["draft", "pending", "approved", "rejected", "sold"], default: "pending" },
    expiresAt: Date,
  },
  { timestamps: true },
);

customerProductSchema.index({ status: 1, categoryId: 1 });
customerProductSchema.index({ title: "text", description: "text", tags: "text" });
withJsonId(customerProductSchema);
export const CustomerProduct = model("CustomerProduct", customerProductSchema);
