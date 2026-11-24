import { Types, type ClientSession } from "mongoose";
import { User } from "../models/User.js";
import { SellerLedger, SellerWithdrawRequest } from "../models/Ledger.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { GeneralSetting } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function lockSellerFunds(sellerId: string, session: ClientSession) {
  const seller = await User.findOneAndUpdate({ _id: sellerId, role: "seller" }, { $inc: { financeRevision: 1 } }, { session, new: true });
  if (!seller) throw new ApiError(404, "Seller not found");
}

export async function sellerFunds(sellerId: string, session?: ClientSession, exceptRequestId?: string) {
  const seller = new Types.ObjectId(sellerId);
  const [balance] = await SellerLedger.aggregate([
    { $match: { sellerId: seller } }, { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]).session(session ?? null);
  const [reserved] = await SellerWithdrawRequest.aggregate([
    { $match: { sellerId: seller, status: { $in: ["pending", "approved"] }, ...(exceptRequestId ? { _id: { $ne: new Types.ObjectId(exceptRequestId) } } : {}) } },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]).session(session ?? null);
  return { balance: balance?.amount ?? 0, reserved: reserved?.amount ?? 0,
    available: Math.round(((balance?.amount ?? 0) - (reserved?.amount ?? 0)) * 100) / 100 };
}

export async function creditSellerWallet(sellerId: string, amount: number, key: string, session: ClientSession) {
  const settings = await GeneralSetting.findOne({ key: "general" }).session(session);
  const currency = settings?.defaultCurrency ?? "INR";
  const wallet = await Wallet.findOneAndUpdate({ userId: sellerId, currency }, {
    $inc: { balance: amount }, $setOnInsert: { currency },
  }, { session, upsert: true, new: true });
  await WalletTransaction.create([{ userId: sellerId, amount, balanceAfter: wallet!.balance, reason: "Seller payout",
    refType: "withdrawal", idempotencyKey: key }], { session });
}
