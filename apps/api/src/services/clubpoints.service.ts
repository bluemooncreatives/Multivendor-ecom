import mongoose from "mongoose";
import { ClubPointConfig, ClubPointTransaction } from "../models/ClubPoints.js";
import { User } from "../models/User.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Addon } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

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

  const order = await Order.findById(orderId).session(session ?? null);
  if (!order?.userId) return;

  const productIds = order.details.flatMap((d) => d.items.map((i) => i.productId));
  const products = await Product.find({ _id: { $in: productIds } })
    .select("clubPoints")
    .session(session ?? null);
  const pointsByProduct = new Map(products.map((p) => [String(p._id), p.clubPoints ?? 0]));

  let points = 0;
  for (const detail of order.details) {
    for (const item of detail.items) {
      points += (pointsByProduct.get(String(item.productId)) ?? 0) * item.quantity;
    }
  }
  if (points <= 0) return;

  await creditPoints(String(order.userId), points, "Order delivered", `order-award:${orderId}`, orderId, session);
}

async function creditPoints(
  userId: string,
  points: number,
  reason: string,
  idempotencyKey: string,
  orderId: string | null,
  session?: mongoose.ClientSession,
) {
  try {
    await ClubPointTransaction.create([{ userId, points, reason, orderId, idempotencyKey }], { session });
  } catch (err) {
    // Duplicate idempotencyKey means these points were already awarded — treat as a no-op
    // rather than an error so callers stay safely retryable.
    if ((err as { code?: number }).code === 11000) return;
    throw err;
  }
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
