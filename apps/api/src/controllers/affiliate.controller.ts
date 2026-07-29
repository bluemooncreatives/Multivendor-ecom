import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { z } from "zod";
import {
  AffiliateUser,
  AffiliateConfig,
  AffiliateEarningDetail,
  AffiliateWithdrawRequest,
  AffiliatePayment,
} from "../models/Affiliate.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function getAffiliateConfigHandler(_req: Request, res: Response) {
  const config = (await AffiliateConfig.findOne()) ?? (await AffiliateConfig.create({}));
  res.json(config);
}

export async function joinAffiliateHandler(req: Request, res: Response) {
  const existing = await AffiliateUser.findOne({ userId: req.user!.id });
  if (existing) return res.json(existing);

  const referralCode = randomBytes(4).toString("hex");
  const affiliate = await AffiliateUser.create({ userId: req.user!.id, referralCode, status: "pending" });
  res.status(201).json(affiliate);
}

export async function getMyAffiliateHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOne({ userId: req.user!.id });
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  res.json(affiliate);
}

export async function listMyAffiliateEarningsHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOne({ userId: req.user!.id });
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  const items = await AffiliateEarningDetail.find({ affiliateUserId: affiliate._id }).sort({ createdAt: -1 });
  res.json({ items });
}

export const affiliateWithdrawSchema = z.object({
  amount: z.number().min(1),
  method: z.enum(["bank_transfer", "wallet", "manual"]),
  bankDetails: z.record(z.unknown()).optional(),
});

export async function createAffiliateWithdrawHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOne({ userId: req.user!.id });
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  if (affiliate.status !== "approved") throw new ApiError(403, "Your affiliate account is not approved yet");

  const config = await getConfig();
  if (!config.enabled) throw new ApiError(403, "The affiliate program is not currently active");
  if (!config.allowedMethods.includes(req.body.method)) {
    throw new ApiError(400, "That payout method is not available");
  }
  if (req.body.amount < config.minWithdrawAmount) {
    throw new ApiError(400, `The minimum withdrawal amount is ${config.minWithdrawAmount}`);
  }

  // Pending requests are counted against the balance too, so an affiliate cannot
  // queue several requests that each pass on their own but overdraw in aggregate.
  const [pending] = await AffiliateWithdrawRequest.aggregate([
    { $match: { affiliateUserId: affiliate._id, status: { $in: ["pending", "approved"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const uncommitted = affiliate.availableBalance - (pending?.total ?? 0);
  if (req.body.amount > uncommitted) {
    throw new ApiError(400, `Amount exceeds your available balance of ${uncommitted}`);
  }

  const request = await AffiliateWithdrawRequest.create({ ...req.body, affiliateUserId: affiliate._id });
  res.status(201).json(request);
}

export const affiliatePaymentSettingsSchema = z.object({
  method: z.enum(["bank_transfer", "wallet", "manual"]),
  accountName: z.string().min(1).max(120).optional(),
  accountNumber: z.string().min(1).max(60).optional(),
  bankName: z.string().min(1).max(120).optional(),
  routingNumber: z.string().max(60).optional(),
  paypalEmail: z.string().email().optional(),
});

export async function getAffiliatePaymentSettingsHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOne({ userId: req.user!.id });
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  res.json(affiliate.paymentSettings ?? {});
}

export async function updateAffiliatePaymentSettingsHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOneAndUpdate(
    { userId: req.user!.id },
    { paymentSettings: req.body },
    { new: true },
  );
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  res.json(affiliate.paymentSettings);
}

export async function listMyAffiliateWithdrawalsHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findOne({ userId: req.user!.id });
  if (!affiliate) throw new ApiError(404, "You have not joined the affiliate program yet");
  const items = await AffiliateWithdrawRequest.find({ affiliateUserId: affiliate._id }).sort({ createdAt: -1 });
  res.json({ items });
}

// Users who signed up through this affiliate's referral code.
export async function listMyReferralsHandler(req: Request, res: Response) {
  const items = await User.find({ referredBy: req.user!.id }).select("name email createdAt").sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}

// --- Admin --------------------------------------------------------------------

async function getConfig() {
  return (await AffiliateConfig.findOne()) ?? (await AffiliateConfig.create({}));
}

export const affiliateConfigSchema = z.object({
  enabled: z.boolean(),
  commissionPercent: z.number().min(0).max(100),
  cookieDays: z.number().int().min(0).max(365),
  minWithdrawAmount: z.number().min(0),
  actionBonuses: z.record(z.number().min(0)).optional(),
  allowedMethods: z.array(z.enum(["bank_transfer", "wallet", "manual"])).min(1),
});

export async function updateAffiliateConfigHandler(req: Request, res: Response) {
  const existing = await getConfig();
  const config = await AffiliateConfig.findByIdAndUpdate(existing._id, req.body, { new: true });
  res.json(config);
}

export async function listAffiliateUsersHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const items = await AffiliateUser.find(status ? { status } : {})
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

export async function getAffiliateUserHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findById(req.params.id).populate("userId", "name email phone");
  if (!affiliate) throw new ApiError(404, "Affiliate not found");

  const [earnings, withdrawals, referrals] = await Promise.all([
    AffiliateEarningDetail.find({ affiliateUserId: affiliate._id }).sort({ createdAt: -1 }).limit(100),
    AffiliateWithdrawRequest.find({ affiliateUserId: affiliate._id }).sort({ createdAt: -1 }).limit(100),
    User.countDocuments({ referredBy: affiliate.userId }),
  ]);
  res.json({ affiliate, earnings, withdrawals, referralCount: referrals });
}

export const moderateAffiliateSchema = z.object({
  status: z.enum(["approved", "suspended", "pending"]),
  rejectionReason: z.string().max(500).optional(),
});

export async function moderateAffiliateUserHandler(req: Request, res: Response) {
  const affiliate = await AffiliateUser.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, rejectionReason: req.body.rejectionReason },
    { new: true },
  );
  if (!affiliate) throw new ApiError(404, "Affiliate not found");
  res.json(affiliate);
}

export async function listAffiliateWithdrawalsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const items = await AffiliateWithdrawRequest.find(status ? { status } : {})
    .populate({ path: "affiliateUserId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

export const resolveAffiliateWithdrawSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(500).optional(),
});

// Paying a withdrawal debits the affiliate's available balance and writes an
// AffiliatePayment record in one transaction, so the balance and the payment
// history can never disagree (the legacy flow updated them in separate requests).
export async function resolveAffiliateWithdrawHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  try {
    let result: unknown;
    await session.withTransaction(async () => {
      const request = await AffiliateWithdrawRequest.findById(req.params.id).session(session);
      if (!request) throw new ApiError(404, "Withdraw request not found");
      if (request.status !== "pending") throw new ApiError(409, "This request has already been resolved");

      if (req.body.approve) {
        const affiliate = await AffiliateUser.findOneAndUpdate(
          { _id: request.affiliateUserId, availableBalance: { $gte: request.amount } },
          { $inc: { availableBalance: -request.amount } },
          { session, new: true },
        );
        if (!affiliate) throw new ApiError(409, "The affiliate no longer has enough balance to cover this payout");

        await AffiliatePayment.create(
          [{ affiliateUserId: request.affiliateUserId, withdrawRequestId: request._id, amount: request.amount }],
          { session },
        );
        request.status = "paid";
      } else {
        request.status = "rejected";
      }
      request.processedBy = req.user!.id as never;
      await request.save({ session });
      result = request;
    });
    res.json(result);
  } finally {
    await session.endSession();
  }
}

export async function listAffiliatePaymentsHandler(req: Request, res: Response) {
  const filter = req.query.affiliateUserId ? { affiliateUserId: req.query.affiliateUserId } : {};
  const items = await AffiliatePayment.find(filter)
    .populate({ path: "affiliateUserId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

// All users acquired through any referral code, for the admin "referrals" report.
export async function listReferredUsersHandler(_req: Request, res: Response) {
  const items = await User.find({ referredBy: { $ne: null } })
    .select("name email createdAt referredBy")
    .populate("referredBy", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}
