import mongoose from "mongoose";
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail } from "../models/Affiliate.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Addon } from "../models/Settings.js";

async function activeConfig() {
  const [addon, config] = await Promise.all([
    Addon.findOne({ key: "affiliate" }),
    AffiliateConfig.findOne(),
  ]);
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

  await User.updateOne({ _id: newUserId }, { referredBy: affiliate.userId });

  const config = await activeConfig();
  const bonus = config?.actionBonuses?.get("signup") ?? 0;
  if (bonus > 0) {
    await AffiliateUser.updateOne(
      { _id: affiliate._id },
      { $inc: { totalEarnings: bonus, availableBalance: bonus } },
    );
  }
}

// Credits the referrer's affiliate commission once an order is actually paid.
// Guarded by a unique (affiliateUserId, orderId) index so a webhook redelivery or
// a manual re-settle cannot pay the same order's commission twice — the legacy
// app recomputed affiliate earnings on every order write and double-paid on retries.
export async function creditAffiliateForOrder(orderId: string) {
  const config = await activeConfig();
  if (!config || config.commissionPercent <= 0) return;

  const order = await Order.findById(orderId);
  if (!order?.userId) return;

  const buyer = await User.findById(order.userId).select("referredBy createdAt");
  if (!buyer?.referredBy) return;

  // Attribution window: the referral only earns on orders placed within cookieDays
  // of the referred account being created.
  if (config.cookieDays > 0) {
    const windowEnd = new Date(buyer.createdAt!.getTime() + config.cookieDays * 24 * 60 * 60 * 1000);
    if (order.createdAt! > windowEnd) return;
  }

  const affiliate = await AffiliateUser.findOne({ userId: buyer.referredBy, status: "approved" });
  if (!affiliate) return;

  // Commission is taken on merchandise value only, never on tax or shipping.
  const merchandise = order.details.reduce((sum, d) => sum + d.subtotal, 0) - order.discount;
  const amount = Math.round(Math.max(0, merchandise) * (config.commissionPercent / 100) * 100) / 100;
  if (amount <= 0) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      try {
        await AffiliateEarningDetail.create(
          [{ affiliateUserId: affiliate._id, orderId: order._id, amount, status: "credited" }],
          { session },
        );
      } catch (err) {
        if ((err as { code?: number }).code === 11000) return; // already credited
        throw err;
      }
      await AffiliateUser.updateOne(
        { _id: affiliate._id },
        { $inc: { totalEarnings: amount, availableBalance: amount } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}

// Reverses a previously credited commission when its order is refunded/cancelled,
// so an affiliate cannot withdraw earnings on a sale that was undone.
export async function reverseAffiliateForOrder(orderId: string) {
  const earning = await AffiliateEarningDetail.findOne({ orderId, status: "credited" });
  if (!earning) return;

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
        { $inc: { totalEarnings: -earning.amount, availableBalance: -earning.amount } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
}
