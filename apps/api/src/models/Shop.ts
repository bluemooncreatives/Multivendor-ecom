import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const shopSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: String,
    bannerUrl: String,
    description: String,
    address: String,
    socialLinks: { type: Map, of: String, default: {} },
    // Per-seller shipping charge, applied once per order when the store runs in
    // seller_wise shipping mode.
    shippingCost: { type: Number, default: 0, min: 0 },
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationDocs: { type: [String], default: [] },
    // Answers to the admin-composed verification form, keyed by field id.
    verificationAnswers: { type: Schema.Types.Mixed, default: {} },
    // Seller subscription state, mirroring the legacy `sellers` columns
    // seller_package_id / remaining_uploads / remaining_digital_uploads /
    // invalid_at. Quota is a *counter* consumed per upload, not a live product
    // count: deleting a listing does not hand the allowance back, exactly as in
    // the legacy app, and a renewal adds to whatever is left.
    sellerPackageId: { type: Schema.Types.ObjectId, ref: "SellerPackage", default: null },
    remainingUploads: { type: Number, default: 0, min: 0 },
    remainingDigitalUploads: { type: Number, default: 0, min: 0 },
    /** Subscription expiry. Null means no subscription has ever been activated. */
    packageInvalidAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

withJsonId(shopSchema);
export const Shop = model("Shop", shopSchema);
