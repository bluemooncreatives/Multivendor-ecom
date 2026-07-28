import { z } from "zod";
import { addDays } from "date-fns";
import { SellerPackage, SellerPackagePayment, CustomerPackage, CustomerPackagePayment } from "../models/Package.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { ApiError } from "../middleware/errorHandler.js";
export async function listSellerPackagesHandler(_req, res) {
    res.json({ items: await SellerPackage.find({ active: true }) });
}
export async function listCustomerPackagesHandler(_req, res) {
    res.json({ items: await CustomerPackage.find({ active: true }) });
}
export const purchasePackageSchema = z.object({
    packageId: z.string(),
    paymentMethod: z.enum(["wallet", "manual"]),
});
// Package purchases reuse the wallet-atomic-debit pattern from checkout, so a
// seller/customer can't buy a package they can't afford. Gateway (Stripe/Razorpay)
// package purchases follow the same pending -> webhook-confirms flow as orders,
// wired up analogously to payment.service.ts once package checkout UI needs it.
export async function purchaseSellerPackageHandler(req, res) {
    const pkg = await SellerPackage.findById(req.body.packageId);
    if (!pkg || !pkg.active)
        throw new ApiError(404, "Package not found");
    if (req.body.paymentMethod === "wallet") {
        const wallet = await Wallet.findOneAndUpdate({ userId: req.user.id, balance: { $gte: pkg.price } }, { $inc: { balance: -pkg.price } }, { new: true });
        if (!wallet)
            throw new ApiError(402, "Insufficient wallet balance");
        await WalletTransaction.create({
            userId: req.user.id,
            amount: -pkg.price,
            balanceAfter: wallet.balance,
            reason: `Seller package: ${pkg.name}`,
            refType: "manual",
            idempotencyKey: `seller-package:${pkg._id}:${req.user.id}:${Date.now()}`,
        });
    }
    const payment = await SellerPackagePayment.create({
        sellerId: req.user.id,
        packageId: pkg._id,
        amount: pkg.price,
        startsAt: new Date(),
        expiresAt: addDays(new Date(), pkg.durationDays),
        paymentMethod: req.body.paymentMethod,
        status: req.body.paymentMethod === "wallet" ? "paid" : "pending",
    });
    res.status(201).json(payment);
}
export async function purchaseCustomerPackageHandler(req, res) {
    const pkg = await CustomerPackage.findById(req.body.packageId);
    if (!pkg || !pkg.active)
        throw new ApiError(404, "Package not found");
    if (req.body.paymentMethod === "wallet") {
        const wallet = await Wallet.findOneAndUpdate({ userId: req.user.id, balance: { $gte: pkg.price } }, { $inc: { balance: -pkg.price } }, { new: true });
        if (!wallet)
            throw new ApiError(402, "Insufficient wallet balance");
        await WalletTransaction.create({
            userId: req.user.id,
            amount: -pkg.price,
            balanceAfter: wallet.balance,
            reason: `Customer package: ${pkg.name}`,
            refType: "manual",
            idempotencyKey: `customer-package:${pkg._id}:${req.user.id}:${Date.now()}`,
        });
    }
    const payment = await CustomerPackagePayment.create({
        userId: req.user.id,
        packageId: pkg._id,
        amount: pkg.price,
        startsAt: new Date(),
        expiresAt: addDays(new Date(), pkg.durationDays),
        paymentMethod: req.body.paymentMethod,
        status: req.body.paymentMethod === "wallet" ? "paid" : "pending",
    });
    res.status(201).json(payment);
}
//# sourceMappingURL=package.controller.js.map