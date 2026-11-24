import type { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Review } from "../models/Address.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";
import { recomputeProductRating, assertReviewsEnabled } from "../services/review.service.js";

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
  await assertReviewsEnabled();
  const { productId, orderId, rating, comment, images } = req.body;
  const order = await Order.findOne({ _id: orderId, userId: req.user!.id });
  if (!order) throw new ApiError(404, "Order not found");

  const purchased = order.details.some(
    (detail) => detail.status === "delivered" && detail.items.some((item) => String(item.productId) === productId),
  );
  if (!purchased) throw new ApiError(403, "You can only review products from delivered orders");

  const review = await Review.findOneAndUpdate(
    { userId: req.user!.id, orderId, productId },
    // An edited review is unread again, so the seller sees the change.
    { userId: req.user!.id, orderId, productId, rating, comment, images, sellerViewed: false },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await recomputeProductRating(review.productId);
  res.status(201).json(review);
}

// Paginated: a popular product's review list is unbounded, and the legacy page
// showed it 15 at a time rather than loading every review ever written.
export async function listProductReviewsHandler(req: Request, res: Response) {
  const { page, pageSize } = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }).parse(req.query);
  if (!Types.ObjectId.isValid(String(req.params.productId))) throw new ApiError(400, "Invalid product ID");
  // Mongoose casts find filters, but never casts aggregation pipelines.
  const filter = { productId: new Types.ObjectId(String(req.params.productId)), approved: true };

  const [items, total, breakdown] = await Promise.all([
    Review.find(filter)
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Review.countDocuments(filter),
    // Star histogram, which the legacy product page rendered from the full list.
    Review.aggregate([{ $match: filter }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
  ]);

  const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const row of breakdown) counts[String(row._id)] = row.count;

  res.json({ items, page, pageSize, total, ratingCounts: counts });
}

export async function listSellerReviewsHandler(req: Request, res: Response) {
  const productIds = await Product.find({ sellerId: req.user!.id }).distinct("_id");
  const reviews = await Review.find({ productId: { $in: productIds } })
    .populate("productId", "name")
    .populate("userId", "name avatarUrl")
    .sort({ createdAt: -1 });

  // The unread count is taken before the list is marked read, so the response can
  // still tell the seller how many were new (legacy `reviews.viewed`).
  const unread = reviews.filter((review) => !review.sellerViewed).length;
  if (unread > 0) {
    await Review.updateMany({ _id: { $in: reviews.filter((review) => !review.sellerViewed).map((review) => review._id) } }, { sellerViewed: true });
  }
  res.json({ items: reviews, unread });
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
  // Hiding or approving a review changes the product's stars, which the rewrite
  // left stale (legacy `updatePublished` recomputed them here).
  await recomputeProductRating(review.productId);
  res.json(review);
}

// Removing a review entirely, which the legacy admin list offered as a delete.
export async function deleteReviewHandler(req: Request, res: Response) {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  await recomputeProductRating(review.productId);
  res.status(204).send();
}
