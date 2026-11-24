import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const affiliateUserSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    referralCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "suspended"], default: "pending" },
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    // Payout destination the affiliate maintains themselves (bank/PayPal details).
    // Free-form because the required fields differ per country/method.
    paymentSettings: { type: Schema.Types.Mixed, default: {} },
    rejectionReason: String,
  },
  { timestamps: true },
);

withJsonId(affiliateUserSchema);
export const AffiliateUser = model("AffiliateUser", affiliateUserSchema);

// Global affiliate program configuration (single document, admin-managed).
const affiliateConfigSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    // Paid on every qualifying order of a referred customer. The legacy program had
    // no such recurring commission, so it defaults to 0 and an admin opts in.
    commissionPercent: { type: Number, default: 0, min: 0, max: 100 },
    cookieDays: { type: Number, default: 30 },
    minWithdrawAmount: { type: Number, default: 500 },
    // Legacy affiliate_options row `user_registration_first_purchase`: a percentage
    // of the referred customer's *first* order, paid to whoever referred them.
    firstPurchase: {
      enabled: { type: Boolean, default: false },
      percent: { type: Number, default: 0, min: 0, max: 100 },
    },
    // Legacy `product_sharing`: a commission to the affiliate whose referral code
    // was attached to a line, as a fixed amount or a percentage of that line.
    productSharing: {
      enabled: { type: Boolean, default: false },
      commissionType: { type: String, enum: ["amount", "percent"], default: "percent" },
      commission: { type: Number, default: 0, min: 0 },
    },
    // Legacy `category_wise_affiliate`: the same, but the rate depends on the
    // line's category. The legacy code treated it as an alternative to product
    // sharing (an `elseif`), and that precedence is preserved.
    categorySharing: {
      enabled: { type: Boolean, default: false },
      rates: {
        type: [
          {
            categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
            commissionType: { type: String, enum: ["amount", "percent"], default: "percent" },
            commission: { type: Number, required: true, min: 0 },
          },
        ],
        default: [],
      },
    },
    // Legacy "affiliate options" — flat bonuses paid for referral actions other
    // than a purchase. Stored as a map so new action types need no migration.
    actionBonuses: {
      type: Map,
      of: Number,
      default: () => ({ signup: 0, product_share: 0, category_share: 0, shop_share: 0 }),
    },
    // Payout methods the admin allows affiliates to select.
    allowedMethods: { type: [String], default: ["bank_transfer", "wallet"] },
  },
  { timestamps: true },
);

withJsonId(affiliateConfigSchema);
export const AffiliateConfig = model("AffiliateConfig", affiliateConfigSchema);

const affiliateEarningDetailSchema = new Schema(
  {
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    // Why this commission was earned. One order can produce several: a
    // first-purchase bonus to the referrer and a share commission per line.
    kind: {
      type: String,
      enum: ["order_commission", "first_purchase", "product_share", "category_share"],
      default: "order_commission",
    },
    /** The line a share commission came from ("<productId>:<sku>"), else null. */
    lineKey: { type: String, default: null },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "credited", "reversed"], default: "pending" },
  },
  { timestamps: true },
);

// One commission row per affiliate, order, kind and line — the DB-level guarantee
// that a redelivered payment webhook cannot pay the same commission twice, while
// still allowing the several distinct commissions one order can legitimately earn.
affiliateEarningDetailSchema.index(
  { affiliateUserId: 1, orderId: 1, kind: 1, lineKey: 1 },
  { unique: true },
);
withJsonId(affiliateEarningDetailSchema);
export const AffiliateEarningDetail = model("AffiliateEarningDetail", affiliateEarningDetailSchema);

const affiliateWithdrawRequestSchema = new Schema(
  {
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bank_transfer", "wallet", "manual"], required: true },
    bankDetails: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

withJsonId(affiliateWithdrawRequestSchema);
export const AffiliateWithdrawRequest = model("AffiliateWithdrawRequest", affiliateWithdrawRequestSchema);

const affiliatePaymentSchema = new Schema(
  {
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    // Null for a direct payout an admin made without the affiliate requesting it
    // (the legacy "pay affiliate" action, separate from resolving a withdrawal).
    withdrawRequestId: { type: Schema.Types.ObjectId, ref: "AffiliateWithdrawRequest", default: null },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: null },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

withJsonId(affiliatePaymentSchema);
export const AffiliatePayment = model("AffiliatePayment", affiliatePaymentSchema);
