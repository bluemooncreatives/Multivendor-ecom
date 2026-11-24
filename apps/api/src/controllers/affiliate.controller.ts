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
import { lockAffiliateFunds, affiliateHolds, creditAffiliateWallet } from "../services/affiliate-funds.service.js";

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

  const session = await mongoose.startSession();
  try {
    let request;
    await session.withTransaction(async () => {
      const locked = await lockAffiliateFunds(String(affiliate._id), session);
      if (locked.status !== "approved") throw new ApiError(403, "Your affiliate account is not approved");
      const held = await affiliateHolds(String(affiliate._id), session);
      if (req.body.amount > locked.availableBalance - held) throw new ApiError(409, "Withdrawal exceeds your available balance");
      [request] = await AffiliateWithdrawRequest.create([{ ...req.body, affiliateUserId: affiliate._id }], { session });
    });
    res.status(201).json(request);
  } finally { await session.endSession(); }
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

const sharingSchema = z.object({
  enabled: z.boolean().default(false),
  commissionType: z.enum(["amount", "percent"]).default("percent"),
  commission: z.number().min(0).default(0),
});

export const affiliateConfigSchema = z.object({
  enabled: z.boolean(),
  commissionPercent: z.number().min(0).max(100),
  cookieDays: z.number().int().min(0).max(365),
  minWithdrawAmount: z.number().min(0),
  // The three legacy affiliate options, each independently switchable.
  firstPurchase: z
    .object({ enabled: z.boolean().default(false), percent: z.number().min(0).max(100).default(0) })
    .optional(),
  productSharing: sharingSchema.optional(),
  categorySharing: z
    .object({
      enabled: z.boolean().default(false),
      rates: z
        .array(
          z.object({
            categoryId: z.string(),
            commissionType: z.enum(["amount", "percent"]).default("percent"),
            commission: z.number().min(0),
          }),
        )
        .default([]),
    })
    .optional(),
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
      const locked = await lockAffiliateFunds(String(request.affiliateUserId), session);

      if (req.body.approve) {
        const held = await affiliateHolds(String(locked._id), session, String(request._id));
        if (locked.status !== "approved" || locked.availableBalance - held < request.amount) throw new ApiError(409, "Insufficient available affiliate balance");
        const affiliate = await AffiliateUser.findOneAndUpdate(
          { _id: request.affiliateUserId, availableBalance: { $gte: request.amount } },
          { $inc: { availableBalance: -request.amount } },
          { session, new: true },
        );
        if (!affiliate) throw new ApiError(409, "The affiliate no longer has enough balance to cover this payout");

        const [payment] = await AffiliatePayment.create(
          [{ affiliateUserId: request.affiliateUserId, withdrawRequestId: request._id, amount: request.amount,
            note: req.body.note, paidBy: req.user!.id, idempotencyKey: `affiliate-withdrawal:${request._id}` }],
          { session },
        );
        if (request.method === "wallet") await creditAffiliateWallet(String(affiliate.userId), request.amount, String(payment!._id), session);
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

export const payAffiliateSchema = z.object({
  amount: z.number().min(0.01),
  note: z.string().max(300).optional(),
  idempotencyKey: z.string().min(10).max(100),
});

/**
 * Direct payout to an affiliate, without them having raised a withdrawal — the
 * legacy admin "pay affiliate" action. Capped at the affiliate's unpaid balance
 * so an admin cannot over-pay past what has actually been earned.
 */
export async function payAffiliateHandler(req: Request, res: Response) {
  const key = `affiliate-direct:${req.params.id}:${req.body.idempotencyKey}`;
  const session = await mongoose.startSession();
  try {
    let payment;
    await session.withTransaction(async () => {
      const affiliate = await lockAffiliateFunds(String(req.params.id), session);
      payment = await AffiliatePayment.findOne({ idempotencyKey: key }).session(session);
      if (payment) return;
      const held = await affiliateHolds(String(affiliate._id), session);
      if (affiliate.status !== "approved" || req.body.amount > affiliate.availableBalance - held) throw new ApiError(409, "Payout exceeds the available affiliate balance");
      affiliate.availableBalance -= req.body.amount;
      await affiliate.save({ session });
      [payment] = await AffiliatePayment.create([{
        affiliateUserId: affiliate._id, withdrawRequestId: null, amount: req.body.amount,
        note: req.body.note ?? null, paidBy: req.user!.id, idempotencyKey: key,
      }], { session });
    });
    res.status(201).json(payment);
  } finally { await session.endSession(); }
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
