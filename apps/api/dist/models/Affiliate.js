import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const affiliateUserSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    referralCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "suspended"], default: "pending" },
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
}, { timestamps: true });
withJsonId(affiliateUserSchema);
export const AffiliateUser = model("AffiliateUser", affiliateUserSchema);
// Global affiliate program configuration (single document, admin-managed).
const affiliateConfigSchema = new Schema({
    enabled: { type: Boolean, default: false },
    commissionPercent: { type: Number, default: 5, min: 0, max: 100 },
    cookieDays: { type: Number, default: 30 },
    minWithdrawAmount: { type: Number, default: 500 },
}, { timestamps: true });
withJsonId(affiliateConfigSchema);
export const AffiliateConfig = model("AffiliateConfig", affiliateConfigSchema);
const affiliateEarningDetailSchema = new Schema({
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "credited", "reversed"], default: "pending" },
}, { timestamps: true });
withJsonId(affiliateEarningDetailSchema);
export const AffiliateEarningDetail = model("AffiliateEarningDetail", affiliateEarningDetailSchema);
const affiliateWithdrawRequestSchema = new Schema({
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bank_transfer", "wallet", "manual"], required: true },
    bankDetails: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
withJsonId(affiliateWithdrawRequestSchema);
export const AffiliateWithdrawRequest = model("AffiliateWithdrawRequest", affiliateWithdrawRequestSchema);
const affiliatePaymentSchema = new Schema({
    affiliateUserId: { type: Schema.Types.ObjectId, ref: "AffiliateUser", required: true, index: true },
    withdrawRequestId: { type: Schema.Types.ObjectId, ref: "AffiliateWithdrawRequest", required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
}, { timestamps: true });
withJsonId(affiliatePaymentSchema);
export const AffiliatePayment = model("AffiliatePayment", affiliatePaymentSchema);
//# sourceMappingURL=Affiliate.js.map