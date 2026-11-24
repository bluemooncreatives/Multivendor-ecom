import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const sellerPackageSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    // Legacy `product_upload` / `digital_product_upload`: the number of uploads the
    // plan grants, added to whatever the seller has left.
    productLimit: { type: Number, required: true, min: 0 },
    digitalProductLimit: { type: Number, default: 0, min: 0 },
    logoUrl: { type: String, default: null },
    commissionRateOverride: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(sellerPackageSchema);
export const SellerPackage = model("SellerPackage", sellerPackageSchema);

const sellerPackagePaymentSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: "SellerPackage", required: true },
    amount: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    paymentMethod: { type: String, enum: ["stripe", "razorpay", "paypal", "wallet", "manual", "sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius", "paytm", "mpesa", "flutterwave", "twocheckout"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    // Client-supplied purchase key. A unique index is what actually stops a
    // double-submitted purchase from debiting the wallet twice; the application
    // check alone loses the race.
    idempotencyKey: { type: String, required: true, unique: true },
    /** Set once quota/expiry have been granted, so a replayed settlement cannot grant twice. */
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

withJsonId(sellerPackagePaymentSchema);
export const SellerPackagePayment = model("SellerPackagePayment", sellerPackagePaymentSchema);

const customerPackageSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    classifiedListingLimit: { type: Number, required: true, min: 0 },
    logoUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(customerPackageSchema);
export const CustomerPackage = model("CustomerPackage", customerPackageSchema);

const customerPackagePaymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: "CustomerPackage", required: true },
    amount: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    paymentMethod: { type: String, enum: ["stripe", "razorpay", "paypal", "wallet", "manual", "sslcommerz", "instamojo", "paystack", "voguepay", "payhere", "ngenius", "paytm", "mpesa", "flutterwave", "twocheckout"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    idempotencyKey: { type: String, required: true, unique: true },
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

withJsonId(customerPackagePaymentSchema);
export const CustomerPackagePayment = model("CustomerPackagePayment", customerPackagePaymentSchema);
