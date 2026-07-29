import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// Replaces the legacy 3-table category/sub_category/sub_sub_category split
// with a single recursive collection capped at 3 levels (0/1/2).
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    level: { type: Number, enum: [0, 1, 2], required: true },
    // Every ancestor from the root down, excluding self. Lets a storefront filter
    // for "everything under Electronics" with one indexed equality match instead of
    // the recursive descent the legacy 3-table split required.
    ancestors: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [], index: true },
    iconUrl: String,
    bannerUrl: String,
    // Legacy bound commission to the category; used when the category-based
    // commission toggle is on, falling back to the global rate when null.
    commissionRate: { type: Number, default: null, min: 0, max: 100 },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ parentId: 1, level: 1 });

withJsonId(categorySchema);
export const Category = model("Category", categorySchema);

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: String,
    // Legacy scoped brands to a sub-sub-category so the product form could cascade
    // category -> sub -> sub-sub -> brands. Empty means "available everywhere".
    categoryIds: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [], index: true },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(brandSchema);
export const Brand = model("Brand", brandSchema);

const attributeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Size"
    values: { type: [String], required: true }, // e.g. ["S", "M", "L"]
    // Same cascade rule as brands: empty means the attribute applies to any category.
    categoryIds: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [], index: true },
  },
  { timestamps: true },
);

withJsonId(attributeSchema);
export const Attribute = model("Attribute", attributeSchema);

const colorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(colorSchema);
export const Color = model("Color", colorSchema);
