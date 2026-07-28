import type { Request, Response } from "express";
import { z } from "zod";
import { Wallet, WalletTransaction, WalletRechargeRequest } from "../models/Wallet.js";
import { ManualPaymentMethod } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function getMyWalletHandler(req: Request, res: Response) {
  const wallet = (await Wallet.findOne({ userId: req.user!.id })) ?? (await Wallet.create({ userId: req.user!.id }));
  res.json(wallet);
}

export async function listMyWalletHistoryHandler(req: Request, res: Response) {
  const items = await WalletTransaction.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}

export const createRechargeRequestSchema = z.object({
  amount: z.number().min(1),
  methodId: z.string(),
  proofUrl: z.string().url(),
});

export async function createRechargeRequestHandler(req: Request, res: Response) {
  const method = await ManualPaymentMethod.findById(req.body.methodId);
  if (!method || !method.active) throw new ApiError(404, "Payment method not available");

  const request = await WalletRechargeRequest.create({
    userId: req.user!.id,
    amount: req.body.amount,
    methodId: req.body.methodId,
    proofUrl: req.body.proofUrl,
  });
  res.status(201).json(request);
}

export async function listMyRechargeRequestsHandler(req: Request, res: Response) {
  res.json({ items: await WalletRechargeRequest.find({ userId: req.user!.id }).sort({ createdAt: -1 }) });
}

export async function listAdminRechargeRequestsHandler(_req: Request, res: Response) {
  res.json({ items: await WalletRechargeRequest.find().populate("userId", "name email").sort({ createdAt: -1 }) });
}

export const resolveRechargeRequestSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

// One-way state machine: only a "pending" request can be resolved, so a
// double-click (or a retried admin request) can never double-credit the wallet.
export async function resolveRechargeRequestHandler(req: Request, res: Response) {
  const request = await WalletRechargeRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Recharge request not found");
  if (request.status !== "pending") throw new ApiError(409, "This request has already been resolved");

  if (req.body.approve) {
    const wallet = await Wallet.findOneAndUpdate(
      { userId: request.userId },
      { $inc: { balance: request.amount } },
      { new: true, upsert: true },
    );
    await WalletTransaction.create({
      userId: request.userId,
      amount: request.amount,
      balanceAfter: wallet!.balance,
      reason: "Wallet recharge approved",
      refType: "recharge",
      refId: request._id,
      idempotencyKey: `recharge:${request._id}`,
    });
    request.status = "approved";
  } else {
    request.status = "rejected";
    request.rejectionReason = req.body.rejectionReason;
  }

  request.resolvedBy = req.user!.id as never;
  await request.save();
  res.json(request);
}
