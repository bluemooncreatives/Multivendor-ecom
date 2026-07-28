import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// Singleton documents (one row each), fetched by admin UI and cached in the app.
// Never written by mutating a running process's env — always DB-backed.
const generalSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "general" },
    appName: { type: String, default: "PHPStore - Be Vocal for Local - Digital India" },
    defaultLanguage: { type: String, default: "en" },
    defaultCurrency: { type: String, default: "INR" },
    defaultTimezone: { type: String, default: "Asia/Kolkata" },
    logoUrl: String,
    faviconUrl: String,
    supportEmail: String,
    supportPhone: String,
  },
  { timestamps: true },
);

withJsonId(generalSettingSchema);
export const GeneralSetting = model("GeneralSetting", generalSettingSchema);

const seoSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "seo" },
    metaTitle: String,
    metaDescription: String,
    googleAnalyticsId: String,
    facebookPixelId: String,
  },
  { timestamps: true },
);

withJsonId(seoSettingSchema);
export const SeoSetting = model("SeoSetting", seoSettingSchema);

const businessSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "business" },
    taxPercent: { type: Number, default: 0 },
    shippingMode: { type: String, enum: ["flat", "weight_based", "area_based", "free"], default: "flat" },
    flatShippingCost: { type: Number, default: 0 },
    minOrderForFreeShipping: { type: Number, default: null },
    demoMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

withJsonId(businessSettingSchema);
export const BusinessSetting = model("BusinessSetting", businessSettingSchema);

const addonSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ["affiliate", "pos", "seller_subscription", "club_points", "classified_products", "manual_payment", "otp", "refunds"],
    },
    enabled: { type: Boolean, default: false },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

withJsonId(addonSchema);
export const Addon = model("Addon", addonSchema);

const manualPaymentMethodSchema = new Schema(
  {
    name: { type: String, required: true },
    instructions: { type: String, required: true },
    accountDetails: Schema.Types.Mixed,
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(manualPaymentMethodSchema);
export const ManualPaymentMethod = model("ManualPaymentMethod", manualPaymentMethodSchema);
