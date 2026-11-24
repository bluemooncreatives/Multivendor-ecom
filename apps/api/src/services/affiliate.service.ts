import mongoose from "mongoose";
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail } from "../models/Affiliate.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Addon } from "../models/Settings.js";
import { Product } from "../models/Product.js";
import { logger } from "../config/logger.js";

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

/**
 * Records one commission and credits the affiliate's balance, in a transaction and
 * exactly once: the unique (affiliate, order, kind, line) index is what makes a
 * redelivered webhook or a manual re-settle a no-op rather than a double payment.
 */
async function creditOnce(input: {
  affiliateUserId: unknown;
  orderId: unknown;
  kind: "order_commission" | "first_purchase" | "product_share" | "category_share";
  lineKey?: string | null;
  amount: number;
}) {
  if (input.amount <= 0) return false;
  const session = await mongoose.startSession();
  try {
    let credited = false;
    await session.withTransaction(async () => {
      credited = false;
      try {
        await AffiliateEarningDetail.create(
          [
            {
              affiliateUserId: input.affiliateUserId,
              orderId: input.orderId,
              kind: input.kind,
              lineKey: input.lineKey ?? null,
              amount: input.amount,
              status: "credited",
            },
          ],
          { session },
        );
      } catch (err) {
        if ((err as { code?: number }).code === 11000) return; // already credited
        throw err;
      }
      await AffiliateUser.updateOne(
        { _id: input.affiliateUserId },
        { $inc: { totalEarnings: input.amount, availableBalance: input.amount } },
        { session },
      );
      credited = true;
    });
    return credited;
  } finally {
    await session.endSession();
  }
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
async function creditShareCommissions(order: any, config: any) {
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
    for (const item of detail.items) {
      const code = item.productReferralCode;
      if (!code) continue;

      const sharer = await AffiliateUser.findOne({ referralCode: String(code).trim(), status: "approved" });
      if (!sharer) continue;
      // Nobody earns a share commission on their own purchase.
      if (order.userId && String(sharer.userId) === String(order.userId)) continue;

      const lineValue = round2(item.unitPrice * item.quantity);
      let rate: { commissionType: string; commission: number } | undefined;

      if (productSharing) {
        rate = { commissionType: config.productSharing.commissionType, commission: config.productSharing.commission };
      } else {
        const product = await Product.findById(item.productId, { categoryId: 1 });
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
      });
    }
  }
}

// Credits the referrer's affiliate commission once an order is actually paid.
// Guarded by a unique (affiliateUserId, orderId) index so a webhook redelivery or
// a manual re-settle cannot pay the same order's commission twice — the legacy
// app recomputed affiliate earnings on every order write and double-paid on retries.
export async function creditAffiliateForOrder(orderId: string) {
  const config = await activeConfig();
  if (!config) return;

  const order = await Order.findById(orderId);
  if (!order) return;

  try {
    // Share-link commissions are paid on the lines themselves and do not depend on
    // who the buyer was referred by - a guest checkout can earn one.
    await creditShareCommissions(order, config);
  } catch (err) {
    logger.error(`Failed to credit share commissions for order ${orderId}: ${String(err)}`);
  }

  if (!order.userId) return;
  const buyer = await User.findById(order.userId).select("referredBy createdAt");
  if (!buyer?.referredBy) return;

  const affiliate = await AffiliateUser.findOne({ userId: buyer.referredBy, status: "approved" });
  if (!affiliate) return;

  // Commission is taken on merchandise value only, never on tax or shipping.
  const merchandise = Math.max(0, order.details.reduce((sum, d) => sum + d.subtotal, 0) - order.discount);

  // Legacy `user_registration_first_purchase`: a percentage of the referred
  // customer's first order, paid once. "First" is decided from the orders that
  // have actually been paid for, so an abandoned checkout does not consume it.
  if (config.firstPurchase?.enabled && config.firstPurchase.percent > 0) {
    const earlierPaidOrders = await Order.countDocuments({
      userId: order.userId,
      paymentStatus: "paid",
      _id: { $ne: order._id },
      createdAt: { $lt: order.createdAt ?? new Date() },
    });
    if (earlierPaidOrders === 0) {
      await creditOnce({
        affiliateUserId: affiliate._id,
        orderId: order._id,
        kind: "first_purchase",
        // The legacy bonus was a percentage of the order total, including tax and
        // shipping, which is what `grand_total` held.
        amount: round2((order.grandTotal * config.firstPurchase.percent) / 100),
      });
    }
  }

  if (config.commissionPercent <= 0) return;

  // Attribution window: the recurring commission only earns on orders placed
  // within cookieDays of the referred account being created.
  if (config.cookieDays > 0) {
    const windowEnd = new Date(buyer.createdAt!.getTime() + config.cookieDays * 24 * 60 * 60 * 1000);
    if ((order.createdAt ?? new Date()) > windowEnd) return;
  }

  await creditOnce({
    affiliateUserId: affiliate._id,
    orderId: order._id,
    kind: "order_commission",
    amount: round2(merchandise * (config.commissionPercent / 100)),
  });
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
          { $inc: { totalEarnings: -earning.amount, availableBalance: -earning.amount } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  }
}
