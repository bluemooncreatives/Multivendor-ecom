import type { Request, Response } from "express";
import { z } from "zod";
import { Coupon, CouponUsage } from "../models/Coupon.js";
import { validateCoupon } from "../services/coupon.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export const couponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["flat", "percent"]),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimitTotal: z.number().int().min(1).optional(),
  usageLimitPerUser: z.number().int().min(1).default(1),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderSubtotal: z.number().min(0),
});

export async function createCouponHandler(req: Request, res: Response) {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
}

export async function listCouponsHandler(_req: Request, res: Response) {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ items: coupons });
}

export async function updateCouponHandler(req: Request, res: Response) {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.json(coupon);
}

// Deactivated, not deleted: CouponUsage rows reference the coupon to enforce
// per-user limits, and orders keep the code for their audit trail.
export async function deleteCouponHandler(req: Request, res: Response) {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { active: false });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(204).send();
}

// Redemption history for one coupon, so an admin can see who used it and when.
export async function getCouponUsageHandler(req: Request, res: Response) {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");

  const usages = await CouponUsage.find({ couponId: coupon._id })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ coupon, usages, usedCount: await CouponUsage.countDocuments({ couponId: coupon._id }) });
}

export async function validateCouponHandler(req: Request, res: Response) {
  const owner = req.user ? { userId: req.user.id } : { guestId: req.header("x-guest-id") };
  const { coupon, discount } = await validateCoupon(req.body.code, req.body.orderSubtotal, owner);
  res.json({ code: coupon.code, discount });
}
