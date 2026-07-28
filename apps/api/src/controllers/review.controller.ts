import type { Request, Response } from "express";
import { z } from "zod";
import { Review } from "../models/Address.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

export const createReviewSchema = z.object({
  productId: z.string(),
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string().url()).default([]),
});

// Only a buyer whose order-detail (for the seller of this product) has actually
// been delivered can review it — mirrors the legacy "verified buyer" review gate.
export async function createReviewHandler(req: Request, res: Response) {
  const { productId, orderId, rating, comment, images } = req.body;
  const order = await Order.findOne({ _id: orderId, userId: req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");

  const purchased = order.details.some(
    (detail) => detail.status === "delivered" && detail.items.some((item) => String(item.productId) === productId),
  );
  if (!purchased) throw new ApiError(403, "You can only review products from delivered orders");

  const review = await Review.findOneAndUpdate(
    { userId: req.user!.id, orderId, productId },
    { userId: req.user!.id, orderId, productId, rating, comment, images },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const stats = await Review.aggregate([
    { $match: { productId: review.productId, approved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { ratingAverage: stats[0]?.avg ?? rating, ratingCount: stats[0]?.count ?? 1 },
  );

  res.status(201).json(review);
}

export async function listProductReviewsHandler(req: Request, res: Response) {
  const reviews = await Review.find({ productId: req.params.productId, approved: true })
    .populate("userId", "name avatarUrl")
    .sort({ createdAt: -1 });
  res.json({ items: reviews });
}

export async function listSellerReviewsHandler(req: Request, res: Response) {
  const productIds = await Product.find({ sellerId: req.user!.id }).distinct("_id");
  const reviews = await Review.find({ productId: { $in: productIds } })
    .populate("productId", "name")
    .sort({ createdAt: -1 });
  res.json({ items: reviews });
}

export const replyReviewSchema = z.object({ sellerReply: z.string().min(1) });

export async function replyReviewHandler(req: Request, res: Response) {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  const product = await Product.findOne({ _id: review.productId, sellerId: req.user!.id });
  if (!product) throw new ApiError(403, "You do not own the product for this review");

  review.sellerReply = req.body.sellerReply;
  await review.save();
  res.json(review);
}

export async function listAdminReviewsHandler(_req: Request, res: Response) {
  const reviews = await Review.find().populate("productId", "name").populate("userId", "name").sort({ createdAt: -1 });
  res.json({ items: reviews });
}

export const moderateReviewSchema = z.object({ approved: z.boolean() });

export async function moderateReviewHandler(req: Request, res: Response) {
  const review = await Review.findByIdAndUpdate(req.params.id, { approved: req.body.approved }, { new: true });
  if (!review) throw new ApiError(404, "Review not found");
  res.json(review);
}
