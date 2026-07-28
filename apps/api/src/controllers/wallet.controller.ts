import type { Request, Response } from "express";
import { Wallet, WalletTransaction } from "../models/Wallet.js";

export async function getMyWalletHandler(req: Request, res: Response) {
  const wallet = (await Wallet.findOne({ userId: req.user!.id })) ?? (await Wallet.create({ userId: req.user!.id }));
  res.json(wallet);
}

export async function listMyWalletHistoryHandler(req: Request, res: Response) {
  const items = await WalletTransaction.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}
