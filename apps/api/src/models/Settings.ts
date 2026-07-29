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
    // Six distinct logo slots, matching the legacy general-settings screen.
    logoUrl: String,
    footerLogoUrl: String,
    adminLogoUrl: String,
    faviconUrl: String,
    loginBackgroundUrl: String,
    loginSidebarUrl: String,
    themeColor: { type: String, default: "#2563eb" },
    address: String,
    footerText: String,
    socialProfiles: {
      type: {
        facebook: String,
        twitter: String,
        instagram: String,
        youtube: String,
        linkedin: String,
      },
      default: () => ({}),
      _id: false,
    },
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
    metaKeywords: { type: [String], default: [] },
    metaImageUrl: String,
    author: String,
    revisitAfterDays: { type: Number, default: 7 },
    sitemapUrl: String,
    // Each tracker has its own switch: the legacy screen let an operator keep the
    // id on file while turning the tracker off.
    googleAnalyticsEnabled: { type: Boolean, default: false },
    googleAnalyticsId: String,
    facebookPixelEnabled: { type: Boolean, default: false },
    facebookPixelId: String,
    facebookChatEnabled: { type: Boolean, default: false },
    facebookPageId: String,
  },
  { timestamps: true },
);

withJsonId(seoSettingSchema);
export const SeoSetting = model("SeoSetting", seoSettingSchema);

// The legacy "activation" screen: a flat list of feature switches that gate whole
// subsystems. Kept as a named sub-document rather than loose booleans so a single
// `settings.activation` read tells a caller everything that is switched on.
const activationSchema = new Schema(
  {
    vendorSystem: { type: Boolean, default: true },
    conversation: { type: Boolean, default: true },
    couponSystem: { type: Boolean, default: true },
    walletSystem: { type: Boolean, default: true },
    pickupPoint: { type: Boolean, default: true },
    guestCheckout: { type: Boolean, default: true },
    classifiedProduct: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    forceHttps: { type: Boolean, default: false },
    emailVerification: { type: Boolean, default: true },
    categoryBasedCommission: { type: Boolean, default: false },
    cashOnDelivery: { type: Boolean, default: true },
    reviewSystem: { type: Boolean, default: true },
  },
  { _id: false },
);

const businessSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "business" },
    taxPercent: { type: Number, default: 0 },
    commissionPercent: { type: Number, default: 10 },
    // `product_wise` and `seller_wise` restore the legacy shipping models: cost
    // taken from each product, or from each seller's shop, rather than one rate.
    shippingMode: {
      type: String,
      enum: ["flat", "product_wise", "seller_wise", "free"],
      default: "flat",
    },
    flatShippingCost: { type: Number, default: 0 },
    // Applied to admin-owned products under seller_wise, which have no shop row.
    adminShippingCost: { type: Number, default: 0 },
    minOrderForFreeShipping: { type: Number, default: null },
    activation: { type: activationSchema, default: () => ({}) },
    // Credential-bearing groups. Every secret inside is AES-GCM encrypted by
    // utils/secrets before it is written, and `select: false` keeps them out of
    // any query that forgets to mask — the legacy app rendered these values
    // straight into the settings form's HTML.
    smtp: { type: Schema.Types.Mixed, default: {}, select: false },
    storage: { type: Schema.Types.Mixed, default: {}, select: false },
    socialLogin: { type: Schema.Types.Mixed, default: {}, select: false },
    recaptcha: { type: Schema.Types.Mixed, default: {}, select: false },
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

// Singleton SMS/OTP configuration. Provider secrets live in `credentials` and are
// `select: false`, so the admin list endpoint can never leak them to the browser —
// the legacy app rendered the raw API keys straight into the settings form.
const otpSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "otp" },
    provider: { type: String, enum: ["twilio", "nexmo", "msg91", "ssl_wireless", "none"], default: "none" },
    otpOnRegistration: { type: Boolean, default: false },
    otpOnForgotPassword: { type: Boolean, default: false },
    otpOnOrderPlacement: { type: Boolean, default: false },
    senderId: String,
    credentials: { type: Schema.Types.Mixed, default: {}, select: false },
  },
  { timestamps: true },
);

withJsonId(otpSettingSchema);
export const OtpSetting = model("OtpSetting", otpSettingSchema);

// Audit record of every admin-triggered bulk SMS blast.
const smsLogSchema = new Schema(
  {
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    audience: { type: String, enum: ["all", "customers", "sellers"], required: true },
    recipientCount: { type: Number, required: true, min: 0 },
    provider: { type: String, required: true },
  },
  { timestamps: true },
);

withJsonId(smsLogSchema);
export const SmsLog = model("SmsLog", smsLogSchema);

// Admin-defined fields on the seller verification form. The legacy app let an
// admin compose this form from text/select/multi-select/radio/file inputs; the
// seller's submitted answers are stored against their shop.
const sellerVerificationFieldSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "select", "multi_select", "radio", "file"], required: true },
    // Only meaningful for the choice types.
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(sellerVerificationFieldSchema);
export const SellerVerificationField = model("SellerVerificationField", sellerVerificationFieldSchema);
