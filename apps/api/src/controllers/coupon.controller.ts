import type { Request, Response } from "express";
import { z } from "zod";
import { Coupon } from "../models/Coupon.js";
import { validateCoupon } from "../services/coupon.service.js";

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

export async function validateCouponHandler(req: Request, res: Response) {
  const owner = req.user ? { userId: req.user.id } : { guestId: req.header("x-guest-id") };
  const { coupon, discount } = await validateCoupon(req.body.code, req.body.orderSubtotal, owner);
  res.json({ code: coupon.code, discount });
}
