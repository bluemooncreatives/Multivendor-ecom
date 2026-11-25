import mongoose from "mongoose";
import { ClubPointConfig, ClubPointTransaction } from "../models/ClubPoints.js";
import { User } from "../models/User.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Addon } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";
import { allocateUnits } from "../utils/allocation.js";

export async function getClubPointConfig() {
  return (await ClubPointConfig.findOne({ key: "club_points" })) ?? (await ClubPointConfig.create({}));
}

async function isEnabled(): Promise<boolean> {
  const addon = await Addon.findOne({ key: "club_points" });
  return addon?.enabled ?? false;
}

// Credits a user's club points for a delivered order. Idempotent on the order id,
// so a retried delivery webhook or a re-run of the fulfillment job cannot double-award
// (the legacy app awarded points on every status write, so points inflated silently).
export async function awardClubPointsForOrder(orderId: string, session?: mongoose.ClientSession) {
  if (!(await isEnabled())) return;
  if (!session) {
    const owned = await mongoose.startSession();
    try {
      await owned.withTransaction(() => awardClubPointsForOrder(orderId, owned));
      return;
    } finally { await owned.endSession(); }
  }

  const order = await Order.findById(orderId).session(session ?? null);
  if (!order?.userId || order.paymentStatus !== "paid") return;
  // Preserve the idempotency of awards made by the old whole-order algorithm.
  if (await ClubPointTransaction.exists({ idempotencyKey: `order-award:${orderId}` }).session(session)) return;

  const productIds = order.details.flatMap((d) => d.items.map((i) => i.productId));
  const products = await Product.find({ _id: { $in: productIds } })
    .select("clubPoints")
    .session(session ?? null);
  const pointsByProduct = new Map(products.map((p) => [String(p._id), p.clubPoints ?? 0]));

  for (const detail of order.details) {
    if (detail.status !== "delivered") continue;
    let points = 0;
    for (const item of detail.items) {
      points += (item.clubPoints ?? pointsByProduct.get(String(item.productId)) ?? 0) * item.quantity;
    }
    if (points <= 0) continue;
    await creditPoints(String(order.userId), points, "Order delivered",
      `order-award:${orderId}:${detail.sellerId ?? "__admin__"}`, orderId, session);
  }
}

/** Claw back only points earned by the returned shipment, in the refund transaction. */
// `fraction` (0..1) reverses only the part of a shipment's earned reward that
// corresponds to the refunded merchandise, so a mixed shipment that refunds some
// of its items claws back rewards proportionally. A full-shipment refund passes 1.
export async function reverseEarnedPointsForShipment(order: InstanceType<typeof Order>, index: number, session: mongoose.ClientSession, fraction = 1) {
  const detail = order.details[index]!;
  const key = `order-award:${order._id}:${detail.sellerId ?? "__admin__"}`;
  const award = await ClubPointTransaction.findOne({ idempotencyKey: key }).session(session);
  const legacy = award ? null : await ClubPointTransaction.findOne({ idempotencyKey: `order-award:${order._id}` }).session(session);
  const base = award?.points ?? (legacy ? allocateUnits(legacy.points, order.details.map((d) => d.subtotal))[index]! : 0);
  const points = Math.round(base * Math.min(1, Math.max(0, fraction)));
  if (points <= 0 || !order.userId) return;
  await creditPoints(String(order.userId), -points, "Returned order rewards reversed", `${key}:reversal`, String(order._id), session);
}

/**
 * Value in currency of `points`, or 0 when the programme is off or the amount is
 * below the configured minimum. Read-only — call spendPointsForOrder to debit.
 */
export async function quotePointsDiscount(points: number): Promise<number> {
  if (points <= 0 || !(await isEnabled())) return 0;

  const config = await getClubPointConfig();
  if (config.convertRate <= 0 || points < config.minConvertPoints) return 0;

  return Math.round(points * config.convertRate * 100) / 100;
}

/**
 * Debits club points as payment towards an order. Guarded on the balance in the
 * same update that decrements it, so two concurrent checkouts cannot both spend
 * the same points, and idempotent on the order id so a retried checkout does not
 * charge twice.
 */
export async function spendPointsForOrder(
  userId: string,
  points: number,
  orderId: string,
  session?: mongoose.ClientSession,
): Promise<number> {
  const discount = await quotePointsDiscount(points);
  if (discount <= 0) throw new ApiError(400, "Those club points cannot be redeemed");

  const user = await User.findOneAndUpdate(
    { _id: userId, clubPoints: { $gte: points } },
    { $inc: { clubPoints: -points } },
    { session, new: true },
  );
  if (!user) throw new ApiError(400, "You do not have enough club points");

  await ClubPointTransaction.create(
    [
      {
        userId,
        points: -points,
        reason: "Redeemed against an order",
        orderId,
        idempotencyKey: `order-spend:${orderId}`,
      },
    ],
    { session },
  );

  return discount;
}

export async function restorePointsForOrder(orderId: string, session: mongoose.ClientSession) {
  const spend = await ClubPointTransaction.findOne({ idempotencyKey: `order-spend:${orderId}` }).session(session);
  if (!spend || spend.points >= 0) return;
  const key = `order-spend-reversal:${orderId}`;
  if (await ClubPointTransaction.exists({ idempotencyKey: key }).session(session)) return;
  await ClubPointTransaction.create([
    { userId: spend.userId, points: -spend.points, reason: "Order cancelled", orderId, idempotencyKey: key },
  ], { session });
  await User.updateOne({ _id: spend.userId }, { $inc: { clubPoints: -spend.points } }, { session });
}

async function creditPoints(
  userId: string,
  points: number,
  reason: string,
  idempotencyKey: string,
  orderId: string | null,
  session?: mongoose.ClientSession,
) {
  const result = await ClubPointTransaction.updateOne({ idempotencyKey }, {
    $setOnInsert: { userId, points, reason, orderId },
  }, { upsert: true, session });
  if (result.upsertedCount !== 1) return;
  await User.updateOne({ _id: userId }, { $inc: { clubPoints: points } }, { session });
}

// Converts points into wallet credit. Runs in a transaction and debits the points
// with a guarded update (`clubPoints: { $gte: points }`) so two concurrent conversion
// requests cannot both succeed against the same balance.
export async function convertPointsToWallet(userId: string, points: number) {
  if (!(await isEnabled())) throw new ApiError(403, "The club points program is not currently active");

  const config = await getClubPointConfig();
  if (points < config.minConvertPoints) {
    throw new ApiError(400, `You need at least ${config.minConvertPoints} points to convert`);
  }
  if (config.convertRate <= 0) throw new ApiError(409, "Point conversion is disabled by the administrator");

  const credit = Math.round(points * config.convertRate * 100) / 100;
  if (credit <= 0) throw new ApiError(400, "The converted amount would be zero");

  const session = await mongoose.startSession();
  try {
    let result!: { points: number; credited: number; balance: number };
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        { _id: userId, clubPoints: { $gte: points } },
        { $inc: { clubPoints: -points } },
        { session, new: true },
      );
      if (!user) throw new ApiError(400, "You do not have enough club points");

      const key = `club-convert:${userId}:${Date.now()}`;
      await ClubPointTransaction.create(
        [{ userId, points: -points, reason: "Converted to wallet credit", idempotencyKey: key }],
        { session },
      );

      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: credit }, $setOnInsert: { currency: "INR" } },
        { session, new: true, upsert: true },
      );
      await WalletTransaction.create(
        [
          {
            userId,
            amount: credit,
            balanceAfter: wallet!.balance,
            reason: `Converted ${points} club points`,
            refType: "manual",
            idempotencyKey: key,
          },
        ],
        { session },
      );

      result = { points, credited: credit, balance: wallet!.balance };
    });
    return result;
  } finally {
    await session.endSession();
  }
}
