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
    iconUrl: String,
    bannerUrl: String,
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(categorySchema);
export const Category = model("Category", categorySchema);

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: String,
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
  },
  { timestamps: true },
);

withJsonId(attributeSchema);
export const Attribute = model("Attribute", attributeSchema);

const colorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true },
  },
  { timestamps: true },
);

withJsonId(colorSchema);
export const Color = model("Color", colorSchema);
