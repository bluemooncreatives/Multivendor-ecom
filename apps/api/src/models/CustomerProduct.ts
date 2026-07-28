import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// OLX-style classified listing posted directly by a customer (not a seller SKU).
const customerProductSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], default: [] },
    location: String,
    contactPhone: String,
    status: { type: String, enum: ["draft", "pending", "approved", "rejected", "sold"], default: "pending" },
    expiresAt: Date,
  },
  { timestamps: true },
);

customerProductSchema.index({ status: 1, categoryId: 1 });
withJsonId(customerProductSchema);
export const CustomerProduct = model("CustomerProduct", customerProductSchema);
