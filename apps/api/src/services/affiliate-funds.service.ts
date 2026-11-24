import { Types, type ClientSession } from "mongoose";
import { AffiliateUser, AffiliateWithdrawRequest } from "../models/Affiliate.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { GeneralSetting } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function lockAffiliateFunds(affiliateId: string, session: ClientSession) {
  const affiliate = await AffiliateUser.findOneAndUpdate({ _id: affiliateId }, { $inc: { financeRevision: 1 } }, { session, new: true });
  if (!affiliate) throw new ApiError(404, "Affiliate not found");
  return affiliate;
}

export async function affiliateHolds(affiliateId: string, session: ClientSession, exceptRequestId?: string) {
  const [row] = await AffiliateWithdrawRequest.aggregate([
    { $match: { affiliateUserId: new Types.ObjectId(affiliateId), status: { $in: ["pending", "approved"] },
      ...(exceptRequestId ? { _id: { $ne: new Types.ObjectId(exceptRequestId) } } : {}) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).session(session);
  return row?.total ?? 0;
}

export async function creditAffiliateWallet(userId: string, amount: number, paymentId: string, session: ClientSession) {
  const setting = await GeneralSetting.findOne({ key: "general" }).session(session);
  const currency = setting?.defaultCurrency ?? "INR";
  const wallet = await Wallet.findOneAndUpdate({ userId, currency }, {
    $inc: { balance: amount }, $setOnInsert: { currency },
  }, { session, new: true, upsert: true });
  await WalletTransaction.create([{ userId, amount, balanceAfter: wallet!.balance, reason: "Affiliate payout",
    refType: "affiliate", refId: paymentId, idempotencyKey: `affiliate-payout:${paymentId}` }], { session });
}
