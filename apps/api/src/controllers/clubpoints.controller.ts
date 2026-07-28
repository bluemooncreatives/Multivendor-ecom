import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { ClubPointTransaction } from "../models/ClubPoints.js";

export async function getMyClubPointsHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  res.json({ points: user?.clubPoints ?? 0 });
}

export async function listMyClubPointHistoryHandler(req: Request, res: Response) {
  const items = await ClubPointTransaction.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}
