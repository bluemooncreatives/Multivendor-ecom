import type { Request, Response } from "express";
import { z } from "zod";
import { addDays } from "date-fns";
import { SellerPackage, SellerPackagePayment, CustomerPackage, CustomerPackagePayment } from "../models/Package.js";
import { Product } from "../models/Product.js";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function listSellerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await SellerPackage.find({ active: true }) });
}

export async function listCustomerPackagesHandler(_req: Request, res: Response) {
  res.json({ items: await CustomerPackage.find({ active: true }) });
}

// The subscription a seller/customer currently holds, so the dashboard can show
// remaining quota and the renewal date.
export async function getMySellerSubscriptionHandler(req: Request, res: Response) {
  const [subscription, productCount] = await Promise.all([
    SellerPackagePayment.findOne({ sellerId: req.user!.id, status: "paid", expiresAt: { $gt: new Date() } })
      .sort({ expiresAt: -1 })
      .populate("packageId"),
    Product.countDocuments({ sellerId: req.user!.id }),
  ]);
  const limit = (subscription?.packageId as unknown as { productLimit?: number } | null)?.productLimit ?? null;
  res.json({
    subscription,
    productCount,
    productLimit: limit,
    remaining: limit === null ? null : Math.max(0, limit - productCount),
  });
}

export async function getMyCustomerSubscriptionHandler(req: Request, res: Response) {
  const [subscription, listingCount] = await Promise.all([
    CustomerPackagePayment.findOne({ userId: req.user!.id, status: "paid", expiresAt: { $gt: new Date() } })
      .sort({ expiresAt: -1 })
      .populate("packageId"),
    CustomerProduct.countDocuments({ userId: req.user!.id, status: { $ne: "rejected" } }),
  ]);
  const limit = (subscription?.packageId as unknown as { classifiedListingLimit?: number } | null)?.classifiedListingLimit ?? null;
  res.json({
    subscription,
    listingCount,
    listingLimit: limit,
    remaining: limit === null ? null : Math.max(0, limit - listingCount),
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
});

// Package purchases reuse the wallet-atomic-debit pattern from checkout, so a
// seller/customer can't buy a package they can't afford. Gateway (Stripe/Razorpay)
// package purchases follow the same pending -> webhook-confirms flow as orders,
// wired up analogously to payment.service.ts once package checkout UI needs it.
export async function purchaseSellerPackageHandler(req: Request, res: Response) {
  const pkg = await SellerPackage.findById(req.body.packageId);
  if (!pkg || !pkg.active) throw new ApiError(404, "Package not found");

  if (req.body.paymentMethod === "wallet") {
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user!.id, balance: { $gte: pkg.price } },
      { $inc: { balance: -pkg.price } },
      { new: true },
    );
    if (!wallet) throw new ApiError(402, "Insufficient wallet balance");
    await WalletTransaction.create({
      userId: req.user!.id,
      amount: -pkg.price,
      balanceAfter: wallet.balance,
      reason: `Seller package: ${pkg.name}`,
      refType: "manual",
      idempotencyKey: `seller-package:${pkg._id}:${req.user!.id}:${Date.now()}`,
    });
  }

  const payment = await SellerPackagePayment.create({
    sellerId: req.user!.id,
    packageId: pkg._id,
    amount: pkg.price,
    startsAt: new Date(),
    expiresAt: addDays(new Date(), pkg.durationDays),
    paymentMethod: req.body.paymentMethod,
    status: req.body.paymentMethod === "wallet" ? "paid" : "pending",
  });
  res.status(201).json(payment);
}

export async function purchaseCustomerPackageHandler(req: Request, res: Response) {
  const pkg = await CustomerPackage.findById(req.body.packageId);
  if (!pkg || !pkg.active) throw new ApiError(404, "Package not found");

  if (req.body.paymentMethod === "wallet") {
    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user!.id, balance: { $gte: pkg.price } },
      { $inc: { balance: -pkg.price } },
      { new: true },
    );
    if (!wallet) throw new ApiError(402, "Insufficient wallet balance");
    await WalletTransaction.create({
      userId: req.user!.id,
      amount: -pkg.price,
      balanceAfter: wallet.balance,
      reason: `Customer package: ${pkg.name}`,
      refType: "manual",
      idempotencyKey: `customer-package:${pkg._id}:${req.user!.id}:${Date.now()}`,
    });
  }

  const payment = await CustomerPackagePayment.create({
    userId: req.user!.id,
    packageId: pkg._id,
    amount: pkg.price,
    startsAt: new Date(),
    expiresAt: addDays(new Date(), pkg.durationDays),
    paymentMethod: req.body.paymentMethod,
    status: req.body.paymentMethod === "wallet" ? "paid" : "pending",
  });
  res.status(201).json(payment);
}

// --- Admin: package catalog ---------------------------------------------------

export const sellerPackageSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  durationDays: z.number().int().min(1).max(3650),
  productLimit: z.number().int().min(0),
  commissionRateOverride: z.number().min(0).max(100).nullable().optional(),
  active: z.boolean().optional(),
});

export const customerPackageSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().min(0),
  durationDays: z.number().int().min(1).max(3650),
  classifiedListingLimit: z.number().int().min(0),
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
// eats into the subscription the seller paid for.
export async function approveSellerPackagePaymentHandler(req: Request, res: Response) {
  const payment = await SellerPackagePayment.findById(req.params.id).populate("packageId");
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "pending") throw new ApiError(409, "This payment has already been processed");

  if (req.body.approve) {
    const durationDays = (payment.packageId as unknown as { durationDays: number }).durationDays;
    payment.startsAt = new Date();
    payment.expiresAt = addDays(new Date(), durationDays);
    payment.status = "paid";
  } else {
    payment.status = "failed";
  }
  await payment.save();
  res.json(payment);
}

export async function approveCustomerPackagePaymentHandler(req: Request, res: Response) {
  const payment = await CustomerPackagePayment.findById(req.params.id).populate("packageId");
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "pending") throw new ApiError(409, "This payment has already been processed");

  if (req.body.approve) {
    const durationDays = (payment.packageId as unknown as { durationDays: number }).durationDays;
    payment.startsAt = new Date();
    payment.expiresAt = addDays(new Date(), durationDays);
    payment.status = "paid";
  } else {
    payment.status = "failed";
  }
  await payment.save();
  res.json(payment);
}

// Sweeps sellers who are now over their plan's product limit (expired or
// downgraded subscription) and unpublishes their newest listings until they fit.
// Oldest products are kept, so a seller never loses their established catalog.
export async function enforceSellerProductLimitsHandler(_req: Request, res: Response) {
  const sellers = await Product.distinct("sellerId", { published: true });
  let unpublished = 0;

  for (const sellerId of sellers) {
    const subscription = await SellerPackagePayment.findOne({
      sellerId,
      status: "paid",
      expiresAt: { $gt: new Date() },
    })
      .sort({ expiresAt: -1 })
      .populate("packageId");

    const limit = (subscription?.packageId as unknown as { productLimit?: number } | null)?.productLimit;
    if (limit === undefined || limit === null) continue; // no active plan caps them

    const overage = (await Product.countDocuments({ sellerId, published: true })) - limit;
    if (overage <= 0) continue;

    const excess = await Product.find({ sellerId, published: true })
      .sort({ createdAt: -1 })
      .limit(overage)
      .select("_id");
    const result = await Product.updateMany({ _id: { $in: excess.map((p) => p._id) } }, { published: false });
    unpublished += result.modifiedCount;
  }

  res.json({ unpublished });
}
