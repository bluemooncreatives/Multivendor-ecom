import type { Request, Response } from "express";
import { z } from "zod";
import { addDays } from "date-fns";
import { SellerPackage, SellerPackagePayment, CustomerPackage, CustomerPackagePayment } from "../models/Package.js";
import { Product } from "../models/Product.js";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { Shop } from "../models/Shop.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/errorHandler.js";
import {
  purchaseSellerPackage,
  purchaseCustomerPackage,
  grantSellerAllowance,
  grantCustomerAllowance,
  unpublishExpiredSellerProducts,
} from "../services/package.service.js";
import mongoose from "mongoose";

export async function listSellerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await SellerPackage.find({ active: true }) });
}

export async function listCustomerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await CustomerPackage.find({ active: true }) });
}

// The subscription a seller/customer currently holds, so the dashboard can show
// remaining quota and the renewal date.
export async function getMySellerSubscriptionHandler(req: Request, res: Response) {
  // Quota is the seller's remaining upload counter (legacy `remaining_uploads`),
  // not a live product count: a deleted listing does not return an upload.
  const [subscription, productCount, shop] = await Promise.all([
    SellerPackagePayment.findOne({ sellerId: req.user!.id, status: "paid" })
      .sort({ expiresAt: -1 })
      .populate("packageId"),
    Product.countDocuments({ sellerId: req.user!.id }),
    Shop.findOne({ sellerId: req.user!.id }, { remainingUploads: 1, remainingDigitalUploads: 1, packageInvalidAt: 1, sellerPackageId: 1 }),
  ]);
  const expiresAt = shop?.packageInvalidAt ?? null;
  res.json({
    subscription,
    packageId: shop?.sellerPackageId ?? null,
    productCount,
    remainingUploads: shop?.remainingUploads ?? 0,
    remainingDigitalUploads: shop?.remainingDigitalUploads ?? 0,
    expiresAt,
    expired: expiresAt ? expiresAt.getTime() <= Date.now() : false,
  });
}

export async function getMyCustomerSubscriptionHandler(req: Request, res: Response) {
  const [subscription, listingCount, user] = await Promise.all([
    CustomerPackagePayment.findOne({ userId: req.user!.id, status: "paid" })
      .sort({ expiresAt: -1 })
      .populate("packageId"),
    CustomerProduct.countDocuments({ userId: req.user!.id, status: { $ne: "rejected" } }),
    User.findById(req.user!.id, { remainingUploads: 1, customerPackageId: 1 }),
  ]);
  res.json({
    subscription,
    packageId: user?.customerPackageId ?? null,
    listingCount,
    // Null means no package was ever bought, which the legacy app left uncapped.
    remainingUploads: user?.customerPackageId ? (user?.remainingUploads ?? 0) : null,
  });
}

export async function listMySellerPackagePaymentsHandler(req: Request, res: Response) {
  const items = await SellerPackagePayment.find({ sellerId: req.user!.id }).populate("packageId").sort({ createdAt: -1 });
  res.json({ items });
}

export async function listMyCustomerPackagePaymentsHandler(req: Request, res: Response) {
  const items = await CustomerPackagePayment.find({ userId: req.user!.id }).populate("packageId").sort({ createdAt: -1 });
  res.json({ items });
}

export const purchasePackageSchema = z.object({
  packageId: z.string(),
  paymentMethod: z.enum(["wallet", "manual"]),
  // Required: without it a double-submitted purchase debits the wallet twice.
  idempotencyKey: z.string().min(8).max(200),
});

// One transaction per purchase: the wallet debit, the payment row and the quota
// grant either all happen or none do, and the purchase key makes a retry a no-op.
// Offline ("manual") purchases record a pending payment and grant nothing until an
// admin approves them.
export async function purchaseSellerPackageHandler(req: Request, res: Response) {
  const payment = await purchaseSellerPackage({
    userId: req.user!.id,
    packageId: req.body.packageId,
    paymentMethod: req.body.paymentMethod,
    idempotencyKey: req.body.idempotencyKey,
  });
  res.status(201).json(payment);
}

export async function purchaseCustomerPackageHandler(req: Request, res: Response) {
  const payment = await purchaseCustomerPackage({
    userId: req.user!.id,
    packageId: req.body.packageId,
    paymentMethod: req.body.paymentMethod,
    idempotencyKey: req.body.idempotencyKey,
  });
  res.status(201).json(payment);
}

// --- Admin: package catalog ---------------------------------------------------

export const sellerPackageSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  durationDays: z.number().int().min(1).max(3650),
  productLimit: z.number().int().min(0),
  digitalProductLimit: z.number().int().min(0).optional(),
  logoUrl: z.string().url().nullable().optional(),
  commissionRateOverride: z.number().min(0).max(100).nullable().optional(),
  active: z.boolean().optional(),
});

export const customerPackageSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  durationDays: z.number().int().min(1).max(3650),
  classifiedListingLimit: z.number().int().min(0),
  logoUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
});

export async function listAllSellerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await SellerPackage.find().sort({ price: 1 }) });
}

export async function createSellerPackageHandler(req: Request, res: Response) {
  res.status(201).json(await SellerPackage.create(req.body));
}

export async function updateSellerPackageHandler(req: Request, res: Response) {
  const pkg = await SellerPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pkg) throw new ApiError(404, "Package not found");
  res.json(pkg);
}

// Retiring a package deactivates it rather than deleting the row: existing
// subscriptions reference it for their commission override and expiry date, and
// a hard delete would orphan those (the legacy destroy() left dangling ids).
export async function deleteSellerPackageHandler(req: Request, res: Response) {
  const pkg = await SellerPackage.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!pkg) throw new ApiError(404, "Package not found");
  res.status(204).send();
}

export async function listAllCustomerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await CustomerPackage.find().sort({ price: 1 }) });
}

export async function createCustomerPackageHandler(req: Request, res: Response) {
  res.status(201).json(await CustomerPackage.create(req.body));
}

export async function updateCustomerPackageHandler(req: Request, res: Response) {
  const pkg = await CustomerPackage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!pkg) throw new ApiError(404, "Package not found");
  res.json(pkg);
}

export async function deleteCustomerPackageHandler(req: Request, res: Response) {
  const pkg = await CustomerPackage.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!pkg) throw new ApiError(404, "Package not found");
  res.status(204).send();
}

// --- Admin: offline package payment approvals ---------------------------------

export async function listSellerPackagePaymentsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const items = await SellerPackagePayment.find(status ? { status } : {})
    .populate("sellerId", "name email")
    .populate("packageId")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

export async function listCustomerPackagePaymentsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const items = await CustomerPackagePayment.find(status ? { status } : {})
    .populate("userId", "name email")
    .populate("packageId")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

export const approvePackagePaymentSchema = z.object({
  approve: z.boolean(),
});

// Approval restarts the subscription clock from the approval moment, not from the
// (possibly days-old) submission time, so an admin's review delay never silently
// eats into the subscription the seller paid for. Status change and quota grant are
// one transaction, and `activatedAt` means a replayed approval cannot grant twice.
export async function approveSellerPackagePaymentHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    await session.withTransaction(async () => {
      const payment = await SellerPackagePayment.findById(req.params.id).populate("packageId").session(session);
      if (!payment) throw new ApiError(404, "Payment not found");
      if (payment.status !== "pending") throw new ApiError(409, "This payment has already been processed");

      if (req.body.approve) {
        const pkg = payment.packageId as unknown as { _id: unknown; durationDays: number; productLimit?: number; digitalProductLimit?: number };
        const now = new Date();
        payment.startsAt = now;
        payment.expiresAt = addDays(now, pkg.durationDays);
        payment.status = "paid";
        payment.activatedAt = now;
        await payment.save({ session });
        await grantSellerAllowance(String(payment.sellerId), pkg, now, session);
      } else {
        payment.status = "failed";
        await payment.save({ session });
      }
      result = payment;
    });
    res.json(result);
  } finally {
    await session.endSession();
  }
}

export async function approveCustomerPackagePaymentHandler(req: Request, res: Response) {
  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    await session.withTransaction(async () => {
      const payment = await CustomerPackagePayment.findById(req.params.id).populate("packageId").session(session);
      if (!payment) throw new ApiError(404, "Payment not found");
      if (payment.status !== "pending") throw new ApiError(409, "This payment has already been processed");

      if (req.body.approve) {
        const pkg = payment.packageId as unknown as { _id: unknown; durationDays: number; classifiedListingLimit?: number };
        const now = new Date();
        payment.startsAt = now;
        payment.expiresAt = addDays(now, pkg.durationDays);
        payment.status = "paid";
        payment.activatedAt = now;
        await payment.save({ session });
        await grantCustomerAllowance(String(payment.userId), pkg, now, session);
      } else {
        payment.status = "failed";
        await payment.save({ session });
      }
      result = payment;
    });
    res.json(result);
  } finally {
    await session.endSession();
  }
}

/**
 * Legacy `SellerPackageController::unpublish_products`: unpublishes the listings of
 * every seller whose subscription has lapsed. Exposed as an admin endpoint so the
 * scheduler (or an operator) can run it; the previous version instead unpublished a
 * seller's *newest* products whenever a live product count exceeded the plan limit,
 * which the legacy app never did and which fights the upload-counter model.
 */
export async function unpublishExpiredSellerProductsHandler(_req: Request, res: Response) {
  res.json(await unpublishExpiredSellerProducts());
}
