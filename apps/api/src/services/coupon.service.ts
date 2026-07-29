import { Coupon, CouponUsage } from "../models/Coupon.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { CartOwner } from "./cart.service.js";

/** One cart line, enough to decide whether a product-scoped coupon applies to it. */
export interface CouponLine {
  productId: string;
  categoryId: string;
  /** Ancestors of the line's category, so a coupon on a parent category matches too. */
  categoryPath?: string[];
  lineSubtotal: number;
}

// Guests are checked by guestId, not just userId — the legacy app's coupon
// validation only ever looked up userId, so guest checkout could not use coupons.
//
// `lines` is optional so simple "is this code valid?" checks still work, but a
// product-scoped coupon needs them: without the cart contents there is no way to
// know which lines qualify, and discounting the whole order would be wrong.
export async function validateCoupon(
  code: string,
  orderSubtotal: number,
  owner: CartOwner,
  lines?: CouponLine[],
) {
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

  // A product-scoped coupon discounts only the qualifying lines, so the base it
  // is applied to is their subtotal rather than the whole order.
  let base = orderSubtotal;
  if (coupon.scope === "product") {
    if (!lines) throw new ApiError(400, "This coupon applies to specific products and needs your cart to be evaluated");

    const productIds = new Set(coupon.productIds.map(String));
    const categoryIds = new Set(coupon.categoryIds.map(String));
    const qualifying = lines.filter(
      (line) =>
        productIds.has(line.productId) ||
        categoryIds.has(line.categoryId) ||
        (line.categoryPath ?? []).some((id) => categoryIds.has(id)),
    );

    if (qualifying.length === 0) throw new ApiError(400, "This coupon does not apply to anything in your cart");
    base = qualifying.reduce((sum, line) => sum + line.lineSubtotal, 0);
  }

  const discount =
    coupon.type === "flat"
      ? Math.min(coupon.value, base)
      : Math.min((base * coupon.value) / 100, coupon.maxDiscount ?? Infinity);

  return { coupon, discount: Math.round(discount * 100) / 100 };
}

export async function recordCouponUsage(couponId: string, orderId: string, owner: CartOwner) {
  await CouponUsage.create({
    couponId,
    orderId,
    userId: owner.userId ?? null,
    guestId: owner.guestId ?? null,
  });
}
