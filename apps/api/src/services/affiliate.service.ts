import mongoose from "mongoose";
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail } from "../models/Affiliate.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Addon } from "../models/Settings.js";
import { Product } from "../models/Product.js";
import { RefundRequest } from "../models/Refund.js";
import { allocateUnits } from "../utils/allocation.js";

async function activeConfig(session?: mongoose.ClientSession) {
  const addon = await Addon.findOne({ key: "affiliate" }).session(session ?? null);
  const config = await AffiliateConfig.findOne().session(session ?? null);
  if (!addon?.enabled || !config?.enabled) return null;
  return config;
}

// Resolves a referral code presented at signup to the referring affiliate.
// Only approved affiliates can accrue referrals — a pending/suspended account's
// code silently does nothing rather than banking earnings it may never be paid.
export async function resolveReferrer(referralCode?: string | null) {
  if (!referralCode) return null;
  const config = await activeConfig();
  if (!config) return null;
  return AffiliateUser.findOne({ referralCode: referralCode.trim(), status: "approved" });
}

// Called from registration. Records the referral link on the new user and pays the
// configured flat signup bonus to the referrer.
export async function attachReferral(newUserId: string, referralCode?: string | null) {
  const affiliate = await resolveReferrer(referralCode);
  if (!affiliate) return;
  if (String(affiliate.userId) === newUserId) return; // cannot refer yourself

  const config = await activeConfig();
  const bonus = config?.actionBonuses?.get("signup") ?? 0;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const attached = await User.updateOne(
        { _id: newUserId, referredBy: null },
        { $set: { referredBy: affiliate.userId } },
        { session },
      );
      if (attached.modifiedCount !== 1 || bonus <= 0) return;
      await AffiliateUser.updateOne(
        { _id: affiliate._id },
        { $inc: { totalEarnings: bonus, availableBalance: bonus } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Records one commission and credits the affiliate's balance, in a transaction and
 * exactly once: the unique (affiliate, order, kind, line) index is what makes a
 * redelivered webhook or a manual re-settle a no-op rather than a double payment.
 */
async function creditOnce(input: {
  affiliateUserId: unknown; orderId: unknown; buyerId?: unknown;
  kind: "order_commission" | "first_purchase" | "product_share" | "category_share";
  lineKey?: string | null; amount: number;
}, session: mongoose.ClientSession) {
  if (input.amount <= 0) return false;
  const key = input.kind === "first_purchase"
    ? { buyerId: input.buyerId, kind: input.kind }
    : { affiliateUserId: input.affiliateUserId, orderId: input.orderId, kind: input.kind, lineKey: input.lineKey ?? null };
  const result = await AffiliateEarningDetail.updateOne(key, {
    $setOnInsert: { ...input, lineKey: input.lineKey ?? null, status: "credited" },
  }, { upsert: true, session });
  if (result.upsertedCount !== 1) return false;
  await AffiliateUser.updateOne({ _id: input.affiliateUserId }, {
    $inc: { totalEarnings: input.amount, availableBalance: input.amount },
  }, { session });
  return true;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Share-link commissions.
 *
 * The legacy program paid the affiliate whose referral code was attached to an
 * order line (`order_details.product_referral_code`), either a flat amount or a
 * percentage of that line, and could instead rate it by the line's category
 * (`product_sharing` vs `category_wise_affiliate`, which its code treated as
 * mutually exclusive). The rewrite stored no per-line referral code at all, so
 * every share link earned nothing however the program was configured.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function creditShareCommissions(order: any, config: any, session: mongoose.ClientSession) {
  const productSharing = config.productSharing?.enabled === true;
  const categorySharing = !productSharing && config.categorySharing?.enabled === true;
  if (!productSharing && !categorySharing) return;

  // Category rates are keyed by category id; a line whose category is not listed
  // earns nothing, as in the legacy loop.
  const rateByCategory = new Map<string, { commissionType: string; commission: number }>(
    (config.categorySharing?.rates ?? []).map((rate: { categoryId: unknown; commissionType: string; commission: number }) => [
      String(rate.categoryId),
      { commissionType: rate.commissionType, commission: rate.commission },
    ]),
  );

  for (const detail of order.details) {
    if (["cancelled", "refunded"].includes(detail.status)) continue;
    for (const item of detail.items) {
      const code = item.productReferralCode;
      if (!code) continue;

      const sharer = await AffiliateUser.findOne({ referralCode: String(code).trim(), status: "approved" }).session(session);
      if (!sharer) continue;
      // Nobody earns a share commission on their own purchase.
      if (order.userId && String(sharer.userId) === String(order.userId)) continue;

      const lineValue = round2(item.unitPrice * item.quantity);
      let rate: { commissionType: string; commission: number } | undefined;

      if (productSharing) {
        rate = { commissionType: config.productSharing.commissionType, commission: config.productSharing.commission };
      } else {
        const product = await Product.findById(item.productId, { categoryId: 1 }).session(session);
        rate = product ? rateByCategory.get(String(product.categoryId)) : undefined;
      }
      if (!rate || rate.commission <= 0) continue;

      const amount = rate.commissionType === "amount"
        ? round2(rate.commission)
        : round2((lineValue * rate.commission) / 100);
      // A flat share commission must never exceed the line it is paid on.
      const capped = Math.min(amount, lineValue);

      await creditOnce({
        affiliateUserId: sharer._id,
        orderId: order._id,
        kind: productSharing ? "product_share" : "category_share",
        lineKey: `${String(item.productId)}:${item.variantSku}`,
        amount: capped,
      }, session);
    }
  }
}

// Credits the referrer's affiliate commission once an order is actually paid.
// Guarded by a unique (affiliateUserId, orderId) index so a webhook redelivery or
// a manual re-settle cannot pay the same order's commission twice — the legacy
// app recomputed affiliate earnings on every order write and double-paid on retries.
export async function creditAffiliateForOrder(orderId: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Claim the entire award, not individual kinds. Configuration changes must
      // never create a second commission when a settlement is retried later.
      const order = await Order.findOneAndUpdate({ _id: orderId, affiliateSettledAt: null,
        paymentStatus: "paid", status: { $nin: ["cancelled", "refunded"] } },
        { $set: { affiliateSettledAt: new Date() } }, { new: true, session });
      if (!order) return;
      const config = await activeConfig(session);
      if (!config) return;
      // Serialize simultaneous orders from one buyer before claiming their
      // first-purchase bonus, even if the newer order settled first.
      if (order.userId) await User.updateOne({ _id: order.userId }, { $inc: { financeRevision: 1 } }, { session });
      await creditShareCommissions(order, config, session);
      if (!order.userId) return;
      const buyer = await User.findById(order.userId).select("referredBy createdAt").session(session);
      if (!buyer?.referredBy || String(buyer.referredBy) === String(order.userId)) return;
      const affiliate = await AffiliateUser.findOne({ userId: buyer.referredBy, status: "approved" }).session(session);
      if (!affiliate) return;
      const merchandise = order.details.reduce((sum, detail) =>
        ["cancelled", "refunded"].includes(detail.status) ? sum : sum + Math.max(0, detail.subtotal - (detail.discount ?? 0)), 0);
      if (config.firstPurchase?.enabled && config.firstPurchase.percent > 0) {
        const earlierPaidOrders = await Order.countDocuments({ userId: order.userId, paymentStatus: "paid",
          status: { $nin: ["cancelled", "refunded"] }, _id: { $ne: order._id }, createdAt: { $lt: order.createdAt } }).session(session);
        if (earlierPaidOrders === 0) {
          const [refund] = await RefundRequest.aggregate([
            { $match: { orderId: order._id, status: "refunded" } },
            { $group: { _id: null, amount: { $sum: "$amount" } } },
          ]).session(session);
          await creditOnce({ affiliateUserId: affiliate._id, orderId: order._id, buyerId: order.userId,
            kind: "first_purchase", amount: round2(Math.max(0, order.grandTotal - (refund?.amount ?? 0)) * config.firstPurchase.percent / 100) }, session);
        }
      }
      if (config.commissionPercent <= 0) return;
      if (config.cookieDays > 0 && order.createdAt > new Date(buyer.createdAt.getTime() + config.cookieDays * 86_400_000)) return;
      await creditOnce({ affiliateUserId: affiliate._id, orderId: order._id, kind: "order_commission",
        amount: round2(merchandise * config.commissionPercent / 100) }, session);
    });
  } finally { await session.endSession(); }
}

// Reverses a previously credited commission when its order is refunded/cancelled,
// so an affiliate cannot withdraw earnings on a sale that was undone.
export async function reverseAffiliateForOrder(orderId: string) {
  // Every commission the order earned, not just the first: one order can pay a
  // first-purchase bonus and a share commission per line, and leaving any of them
  // credited would let an affiliate withdraw earnings on a sale that was undone.
  const earnings = await AffiliateEarningDetail.find({ orderId, status: "credited" });
  if (earnings.length === 0) return;

  for (const earning of earnings) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await AffiliateEarningDetail.findOneAndUpdate(
          { _id: earning._id, status: "credited" },
          { status: "reversed" },
          { session, new: true },
        );
        if (!updated) return; // another request already reversed it

        await AffiliateUser.updateOne(
          { _id: earning.affiliateUserId },
          { $inc: { totalEarnings: -(updated.amount - updated.reversedAmount), availableBalance: -(updated.amount - updated.reversedAmount) } },
          { session },
        );
        updated.reversedAmount = updated.amount;
        await updated.save({ session });
      });
    } finally {
      await session.endSession();
    }
  }
}

/** Reverse the refunded shipment's share without clawing back other vendors' sales. */
export async function reverseAffiliateForShipment(order: InstanceType<typeof Order>, index: number, session: mongoose.ClientSession) {
  const detail = order.details[index]!;
  const lineKeys = new Set(detail.items.map((item) => `${item.productId}:${item.variantSku}`));
  const weights = order.details.map((shipment) => Math.max(0, shipment.subtotal - (shipment.discount ?? 0)));
  const earnings = await AffiliateEarningDetail.find({ orderId: order._id, status: "credited" }).session(session);
  for (const earning of earnings) {
    const share = ["product_share", "category_share"].includes(earning.kind);
    const amount = share
      ? (earning.lineKey && lineKeys.has(earning.lineKey) ? earning.amount : 0)
      : allocateUnits(Math.round(earning.amount * 100), weights)[index]! / 100;
    const reversal = Math.min(amount, Math.max(0, earning.amount - earning.reversedAmount));
    if (reversal <= 0) continue;
    earning.reversedAmount = round2(earning.reversedAmount + reversal);
    if (earning.reversedAmount >= earning.amount) earning.status = "reversed";
    await earning.save({ session });
    await AffiliateUser.updateOne({ _id: earning.affiliateUserId }, {
      $inc: { totalEarnings: -reversal, availableBalance: -reversal },
    }, { session });
  }
}
