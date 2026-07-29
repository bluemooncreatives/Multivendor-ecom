import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { ClubPointConfig, ClubPointTransaction } from "../models/ClubPoints.js";
import { getClubPointConfig, convertPointsToWallet } from "../services/clubpoints.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function getMyClubPointsHandler(req: Request, res: Response) {
  const [user, config] = await Promise.all([User.findById(req.user!.id), getClubPointConfig()]);
  const points = user?.clubPoints ?? 0;
  res.json({
    points,
    convertRate: config.convertRate,
    minConvertPoints: config.minConvertPoints,
    convertibleValue: Math.round(points * config.convertRate * 100) / 100,
  });
}

export async function listMyClubPointHistoryHandler(req: Request, res: Response) {
  const items = await ClubPointTransaction.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}

export const convertClubPointsSchema = z.object({
  points: z.number().int().min(1),
});

export async function convertClubPointsHandler(req: Request, res: Response) {
  res.json(await convertPointsToWallet(req.user!.id, req.body.points));
}

// --- Admin ------------------------------------------------------------------

export const clubPointConfigSchema = z.object({
  convertRate: z.number().min(0),
  minConvertPoints: z.number().int().min(0),
});

export async function getClubPointConfigHandler(_req: Request, res: Response) {
  res.json(await getClubPointConfig());
}

export async function updateClubPointConfigHandler(req: Request, res: Response) {
  const config = await ClubPointConfig.findOneAndUpdate({ key: "club_points" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json(config);
}

export async function listProductClubPointsHandler(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 30);
  const filter = req.query.assignedOnly === "true" ? { clubPoints: { $gt: 0 } } : {};

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select("name slug clubPoints basePrice sellerId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pageSize });
}

export const setProductClubPointsSchema = z.object({
  clubPoints: z.number().int().min(0),
});

export async function setProductClubPointsHandler(req: Request, res: Response) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { clubPoints: req.body.clubPoints },
    { new: true },
  ).select("name slug clubPoints");
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
}

export const setAllProductClubPointsSchema = z.object({
  clubPoints: z.number().int().min(0),
  // Optional narrowing so an admin can point-boost one category or seller instead
  // of the whole catalog. The legacy bulk action had no scope and always hit every row.
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
});

export async function setAllProductClubPointsHandler(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.body.categoryId) filter.categoryId = req.body.categoryId;
  if (req.body.sellerId) filter.sellerId = req.body.sellerId;

  const result = await Product.updateMany(filter, { clubPoints: req.body.clubPoints });
  res.json({ matched: result.matchedCount, updated: result.modifiedCount });
}

export async function listClubPointUsersHandler(_req: Request, res: Response) {
  const items = await User.find({ clubPoints: { $gt: 0 } })
    .select("name email clubPoints")
    .sort({ clubPoints: -1 })
    .limit(200);
  res.json({ items });
}

// Per-user point ledger for admin support ("why does this customer have N points?").
export async function getUserClubPointDetailHandler(req: Request, res: Response) {
  const user = await User.findById(req.params.id).select("name email clubPoints");
  if (!user) throw new ApiError(404, "User not found");
  const items = await ClubPointTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(200);
  res.json({ user, items });
}
