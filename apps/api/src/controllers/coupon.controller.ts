import type { Request, Response } from "express";
import { z } from "zod";
import { Coupon, CouponUsage } from "../models/Coupon.js";
import { validateCoupon } from "../services/coupon.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { priceLine } from "../services/shipping.service.js";
import { resolveFlashDeals, dealKey } from "../services/flashdeal.service.js";

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(30),
  type: z.enum(["flat", "percent"]),
  value: z.number().min(0),
  scope: z.enum(["cart", "product"]).default("cart"),
  productIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  categoryIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  active: z.boolean().optional(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).nullable().optional(),
  usageLimitTotal: z.number().int().min(1).nullable().optional(),
  usageLimitPerUser: z.number().int().min(1).default(1),
  startsAt: z.preprocess((value) => value === "" ? null : value, z.coerce.date().nullable().optional()),
  expiresAt: z.preprocess((value) => value === "" ? null : value, z.coerce.date().nullable().optional()),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderSubtotal: z.number().min(0).optional(), // retained for older clients; never trusted
});

export async function createCouponHandler(req: Request, res: Response) {
  assertCouponDefinition(req.body);
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
}

export async function listCouponsHandler(_req: Request, res: Response) {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ items: coupons });
}

export async function updateCouponHandler(req: Request, res: Response) {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  Object.assign(coupon, req.body);
  assertCouponDefinition(coupon);
  await coupon.save();
  res.json(coupon);
}

function assertCouponDefinition(coupon: { type: string; value: number; startsAt?: Date | null; expiresAt?: Date | null; scope?: string; productIds?: unknown[]; categoryIds?: unknown[] }) {
  if (coupon.type === "percent" && coupon.value > 100) throw new ApiError(422, "A percentage discount cannot exceed 100");
  if (coupon.startsAt && coupon.expiresAt && coupon.expiresAt < coupon.startsAt) throw new ApiError(422, "Expiry must follow the start date");
  if (coupon.scope === "product" && !coupon.productIds?.length && !coupon.categoryIds?.length) throw new ApiError(422, "Select eligible products or categories");
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
  if (!owner.userId && !owner.guestId) throw new ApiError(400, "A cart owner is required");
  const cart = await Cart.findOne(owner);
  if (!cart?.items.length) throw new ApiError(400, "Your cart is empty");
  const products = await Product.find({ _id: { $in: cart.items.map((item) => item.productId) }, published: true, approvalStatus: "approved" });
  const categories = await Category.find({ _id: { $in: products.map((product) => product.categoryId) } });
  // Previewing against the campaign price keeps the quoted discount identical to
  // the one checkout will compute.
  const flashDeals = await resolveFlashDeals(
    cart.items.map((item) => ({ productId: String(item.productId), variantSku: item.variantSku })),
  );
  const lines = cart.items.map((item) => {
    const product = products.find((p) => String(p._id) === String(item.productId));
    const variant = product?.variants.find((v) => v.sku === item.variantSku);
    if (!product || !variant) throw new ApiError(409, "One of your cart items is no longer available");
    const flashDeal = flashDeals.get(dealKey(String(product._id), item.variantSku)) ?? null;
    const priced = priceLine({ unitPrice: variant.price, quantity: item.quantity, discount: product.discount, discountType: product.discountType,
      flashDiscount: flashDeal ? { discount: flashDeal.discount, discountType: flashDeal.discountType } : null,
      tax: 0, taxType: "flat", storeTaxPercent: 0 });
    return { productId: String(product._id), categoryId: String(product.categoryId),
      categoryPath: categories.find((c) => String(c._id) === String(product.categoryId))?.ancestors.map(String) ?? [],
      lineSubtotal: priced.lineSubtotal };
  });
  const subtotal = Math.round(lines.reduce((sum, line) => sum + line.lineSubtotal, 0) * 100) / 100;
  const { coupon, discount } = await validateCoupon(req.body.code, subtotal, owner, lines);
  res.json({ code: coupon.code, discount });
}
