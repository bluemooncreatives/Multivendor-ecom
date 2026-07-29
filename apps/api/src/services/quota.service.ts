import { SellerPackagePayment, CustomerPackagePayment } from "../models/Package.js";
import { Product } from "../models/Product.js";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { Addon } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

async function addonEnabled(key: "seller_subscription" | "classified_products") {
  const addon = await Addon.findOne({ key });
  return addon?.enabled ?? false;
}

// Enforced at creation time, not just by the periodic sweep, so a seller is told
// "upgrade your plan" up front instead of having the listing silently unpublished
// later. When the subscription add-on is off, listings are unlimited.
export async function assertSellerCanAddProduct(sellerId: string) {
  if (!(await addonEnabled("seller_subscription"))) return;

  const subscription = await SellerPackagePayment.findOne({
    sellerId,
    status: "paid",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .populate("packageId");

  if (!subscription) {
    throw new ApiError(403, "An active seller package is required before you can list products");
  }

  const limit = (subscription.packageId as unknown as { productLimit?: number } | null)?.productLimit;
  if (limit === undefined || limit === null) return;

  const count = await Product.countDocuments({ sellerId });
  if (count >= limit) {
    throw new ApiError(403, `Your package allows ${limit} products. Upgrade your package to list more.`);
  }
}

export async function assertCustomerCanAddClassified(userId: string) {
  if (!(await addonEnabled("classified_products"))) return;

  const subscription = await CustomerPackagePayment.findOne({
    userId,
    status: "paid",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .populate("packageId");

  if (!subscription) return; // no package purchased: the free tier is uncapped

  const limit = (subscription.packageId as unknown as { classifiedListingLimit?: number } | null)?.classifiedListingLimit;
  if (limit === undefined || limit === null) return;

  const count = await CustomerProduct.countDocuments({ userId, status: { $ne: "rejected" } });
  if (count >= limit) {
    throw new ApiError(403, `Your package allows ${limit} listings. Upgrade your package to post more.`);
  }
}
