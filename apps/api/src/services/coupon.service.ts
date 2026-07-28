import { Coupon, CouponUsage } from "../models/Coupon.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { CartOwner } from "./cart.service.js";

// Guests are checked by guestId, not just userId — the legacy app's coupon
// validation only ever looked up userId, so guest checkout could not use coupons.
export async function validateCoupon(code: string, orderSubtotal: number, owner: CartOwner) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) throw new ApiError(404, "Invalid coupon code");

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new ApiError(400, "This coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ApiError(400, "This coupon has expired");
  if (orderSubtotal < coupon.minOrderValue) {
    throw new ApiError(400, `This coupon requires a minimum order of ${coupon.minOrderValue}`);
  }

  const usageFilter = owner.userId ? { couponId: coupon._id, userId: owner.userId } : { couponId: coupon._id, guestId: owner.guestId };
  const usageCount = await CouponUsage.countDocuments(usageFilter);
  if (usageCount >= coupon.usageLimitPerUser) {
    throw new ApiError(400, "You have already used this coupon");
  }

  if (coupon.usageLimitTotal !== null && coupon.usageLimitTotal !== undefined) {
    const totalUsage = await CouponUsage.countDocuments({ couponId: coupon._id });
    if (totalUsage >= coupon.usageLimitTotal) throw new ApiError(400, "This coupon has reached its usage limit");
  }

  const discount =
    coupon.type === "flat"
      ? Math.min(coupon.value, orderSubtotal)
      : Math.min((orderSubtotal * coupon.value) / 100, coupon.maxDiscount ?? Infinity);

  return { coupon, discount };
}

export async function recordCouponUsage(couponId: string, orderId: string, owner: CartOwner) {
  await CouponUsage.create({
    couponId,
    orderId,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  });
}
