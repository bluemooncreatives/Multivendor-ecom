import mongoose, { type ClientSession } from "mongoose";
import { addDays } from "date-fns";
import {
  SellerPackage,
  SellerPackagePayment,
  CustomerPackage,
  CustomerPackagePayment,
} from "../models/Package.js";
import { Shop } from "../models/Shop.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { Addon } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Seller and customer subscription packages.
 *
 * Legacy reference: `SellerPackageController::purchase_payment_done` and
 * `CustomerPackageController`. Both granted an allowance the same way:
 *
 *   seller->seller_package_id          = package
 *   seller->remaining_uploads         += package->product_upload
 *   seller->remaining_digital_uploads += package->digital_product_upload
 *   seller->invalid_at                 = today + package->duration days
 *
 * Three properties of that model are preserved here, because the product
 * controllers depend on them:
 *
 *  - the allowance is a **counter**, decremented once per upload
 *    (`ProductController@store`, `DigitalProductController@store`), so deleting a
 *    listing does not hand the allowance back;
 *  - a renewal **adds** to whatever is left rather than resetting it;
 *  - the expiry is recomputed from the purchase date, not extended from the old
 *    expiry, so a renewal bought early does not stack duration.
 *
 * What the legacy app did *not* have, and is added here, is atomicity: it debited,
 * granted and recorded in three unrelated writes with no transaction and no replay
 * key, so an interrupted purchase could take the money without granting the plan
 * (or grant it twice on a double-submit).
 */

export type PackageKind = "seller" | "customer";

interface PurchaseInput {
  userId: string;
  packageId: string;
  paymentMethod: "wallet" | "manual";
  idempotencyKey: string;
}

/** A free plan may be taken once; re-taking the one already held is refused. */
function assertFreePackageAllowed(price: number, currentPackageId: string | null, packageId: string) {
  if (price === 0 && currentPackageId && currentPackageId === packageId) {
    throw new ApiError(409, "You cannot purchase this package anymore");
  }
}

async function debitWallet(
  userId: string,
  amount: number,
  reason: string,
  key: string,
  session: ClientSession,
) {
  if (amount <= 0) return; // free plan: nothing to debit, and no wallet row needed
  const wallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { session, new: true },
  );
  if (!wallet) throw new ApiError(402, "Insufficient wallet balance");

  await WalletTransaction.create(
    [
      {
        userId,
        amount: -amount,
        balanceAfter: wallet.balance,
        reason,
        refType: "manual",
        idempotencyKey: key,
      },
    ],
    { session },
  );
}

export async function purchaseSellerPackage(input: PurchaseInput) {
  const replay = await SellerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey });
  if (replay) return assertPaymentOwner(replay.sellerId, input.userId, replay);

  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let created: any = null;
    await session.withTransaction(async () => {
      const inFlight = await SellerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (inFlight) { created = assertPaymentOwner(inFlight.sellerId, input.userId, inFlight); return; }

      const pkg = await SellerPackage.findById(input.packageId).session(session);
      if (!pkg || !pkg.active) throw new ApiError(404, "Package not found");

      // The shop row is the seller's subscription record (legacy `sellers`), so a
      // seller without one cannot hold a plan.
      const shop = await Shop.findOne({ sellerId: input.userId }).session(session);
      if (!shop) throw new ApiError(400, "Create your shop before purchasing a package");
      assertFreePackageAllowed(pkg.price, shop.sellerPackageId ? String(shop.sellerPackageId) : null, String(pkg._id));

      const paid = input.paymentMethod === "wallet" || pkg.price === 0;
      if (input.paymentMethod === "wallet") {
        await debitWallet(
          input.userId,
          pkg.price,
          `Seller package: ${pkg.name}`,
          `seller-package:${input.idempotencyKey}`,
          session,
        );
      }

      const now = new Date();
      const [payment] = await SellerPackagePayment.create(
        [
          {
            sellerId: input.userId,
            packageId: pkg._id,
            amount: pkg.price,
            startsAt: now,
            expiresAt: addDays(now, pkg.durationDays),
            paymentMethod: input.paymentMethod,
            status: paid ? "paid" : "pending",
            idempotencyKey: input.idempotencyKey,
            activatedAt: paid ? now : null,
          },
        ],
        { session },
      );

      // An offline ("manual") purchase grants nothing until an admin approves it.
      if (paid) await grantSellerAllowance(String(input.userId), pkg, now, session);
      created = payment;
    });
    return created;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const existing = await SellerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey });
      if (existing) return assertPaymentOwner(existing.sellerId, input.userId, existing);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function purchaseCustomerPackage(input: PurchaseInput) {
  const replay = await CustomerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey });
  if (replay) return assertPaymentOwner(replay.userId, input.userId, replay);

  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let created: any = null;
    await session.withTransaction(async () => {
      const inFlight = await CustomerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (inFlight) { created = assertPaymentOwner(inFlight.userId, input.userId, inFlight); return; }

      const pkg = await CustomerPackage.findById(input.packageId).session(session);
      if (!pkg || !pkg.active) throw new ApiError(404, "Package not found");

      const user = await User.findById(input.userId).session(session);
      if (!user) throw new ApiError(404, "Account not found");
      assertFreePackageAllowed(pkg.price, user.customerPackageId ? String(user.customerPackageId) : null, String(pkg._id));

      const paid = input.paymentMethod === "wallet" || pkg.price === 0;
      if (input.paymentMethod === "wallet") {
        await debitWallet(
          input.userId,
          pkg.price,
          `Customer package: ${pkg.name}`,
          `customer-package:${input.idempotencyKey}`,
          session,
        );
      }

      const now = new Date();
      const [payment] = await CustomerPackagePayment.create(
        [
          {
            userId: input.userId,
            packageId: pkg._id,
            amount: pkg.price,
            startsAt: now,
            expiresAt: addDays(now, pkg.durationDays),
            paymentMethod: input.paymentMethod,
            status: paid ? "paid" : "pending",
            idempotencyKey: input.idempotencyKey,
            activatedAt: paid ? now : null,
          },
        ],
        { session },
      );

      if (paid) await grantCustomerAllowance(String(input.userId), pkg, now, session);
      created = payment;
    });
    return created;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const existing = await CustomerPackagePayment.findOne({ idempotencyKey: input.idempotencyKey });
      if (existing) return assertPaymentOwner(existing.userId, input.userId, existing);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

// A purchase key is per-account: replaying someone else's key must not disclose
// (or re-serve) their purchase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertPaymentOwner(ownerId: unknown, userId: string, payment: any) {
  if (String(ownerId) !== String(userId)) throw new ApiError(409, "Purchase key is already in use");
  return payment;
}

/**
 * Grants a seller plan. Returns false when the seller has no shop row to hold the
 * allowance, which the caller must treat as "paid but not delivered" rather than
 * as success - the legacy app wrote to `sellers` unconditionally and silently did
 * nothing for a user who had never opened a shop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function grantSellerAllowance(sellerId: string, pkg: any, at: Date, session: ClientSession): Promise<boolean> {
  const result = await Shop.updateOne(
    { sellerId },
    {
      $set: {
        sellerPackageId: pkg._id,
        // Legacy recomputed the expiry from "today", so renewing early shortens
        // nothing but also does not stack the remaining days.
        packageInvalidAt: addDays(at, pkg.durationDays),
      },
      $inc: {
        remainingUploads: pkg.productLimit ?? 0,
        remainingDigitalUploads: pkg.digitalProductLimit ?? 0,
      },
    },
    { session },
  );
  return result.matchedCount > 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function grantCustomerAllowance(userId: string, pkg: any, at: Date, session: ClientSession): Promise<boolean> {
  const result = await User.updateOne(
    { _id: userId },
    {
      $set: { customerPackageId: pkg._id, packageInvalidAt: addDays(at, pkg.durationDays) },
      $inc: { remainingUploads: pkg.classifiedListingLimit ?? 0 },
    },
    { session },
  );
  return result.matchedCount > 0;
}

/** True when this account may still buy `packageId` (the free-plan rule). */
export async function canPurchasePackage(kind: PackageKind, userId: string, packageId: string, price: number) {
  if (price !== 0) return true;
  const current = kind === "seller"
    ? (await Shop.findOne({ sellerId: userId }, { sellerPackageId: 1 }))?.sellerPackageId
    : (await User.findById(userId, { customerPackageId: 1 }))?.customerPackageId;
  return !current || String(current) !== String(packageId);
}

async function addonEnabled(key: "seller_subscription" | "classified_products") {
  const addon = await Addon.findOne({ key });
  return addon?.enabled ?? false;
}

export type UploadKind = "product" | "digital";

/**
 * Consumes one upload from the seller's allowance, atomically. The legacy
 * controllers decremented *after* saving the product with a plain `save()`, so two
 * concurrent uploads both passed the `remaining_uploads > 0` check and the counter
 * could go negative. Here the decrement is the check: a conditional update that
 * only matches while the allowance (and the subscription) is still valid.
 *
 * Returns a release callback so a failed product insert gives the allowance back.
 */
export async function consumeSellerUpload(sellerId: string, kind: UploadKind): Promise<() => Promise<void>> {
  if (!(await addonEnabled("seller_subscription"))) return async () => {};

  const field = kind === "digital" ? "remainingDigitalUploads" : "remainingUploads";
  const shop = await Shop.findOne({ sellerId }, { packageInvalidAt: 1, sellerPackageId: 1 });
  if (!shop) throw new ApiError(400, "Create your shop before listing products");
  if (!shop.sellerPackageId) throw new ApiError(403, "An active seller package is required before you can list products");
  if (shop.packageInvalidAt && shop.packageInvalidAt.getTime() <= Date.now()) {
    throw new ApiError(403, "Your seller package has expired. Renew it to list products.");
  }

  const consumed = await Shop.findOneAndUpdate(
    { sellerId, [field]: { $gte: 1 } },
    { $inc: { [field]: -1 } },
    { new: true },
  );
  if (!consumed) {
    throw new ApiError(
      403,
      kind === "digital"
        ? "Your digital upload limit has been reached. Please upgrade your package."
        : "Your upload limit has been reached. Please upgrade your package.",
    );
  }

  return async () => {
    await Shop.updateOne({ sellerId }, { $inc: { [field]: 1 } });
  };
}

export async function consumeCustomerUpload(userId: string): Promise<() => Promise<void>> {
  if (!(await addonEnabled("classified_products"))) return async () => {};

  const user = await User.findById(userId, { remainingUploads: 1, customerPackageId: 1 });
  if (!user) throw new ApiError(404, "Account not found");
  // No package ever bought: the legacy app left the free tier uncapped.
  if (!user.customerPackageId) return async () => {};

  const consumed = await User.findOneAndUpdate(
    { _id: userId, remainingUploads: { $gte: 1 } },
    { $inc: { remainingUploads: -1 } },
    { new: true },
  );
  if (!consumed) throw new ApiError(403, "Your upload limit has been reached. Please upgrade your package.");

  return async () => {
    await User.updateOne({ _id: userId }, { $inc: { remainingUploads: 1 } });
  };
}

/** A seller whose subscription has lapsed may not publish (legacy `updatePublished`). */
export async function assertSellerPackageValid(sellerId: string) {
  if (!(await addonEnabled("seller_subscription"))) return;
  const shop = await Shop.findOne({ sellerId }, { packageInvalidAt: 1 });
  if (shop?.packageInvalidAt && shop.packageInvalidAt.getTime() <= Date.now()) {
    throw new ApiError(403, "Your seller package has expired. Renew it to publish products.");
  }
}

/**
 * Legacy `SellerPackageController::unpublish_products`, run on a schedule: every
 * seller whose subscription has lapsed has their listings unpublished. The legacy
 * version loaded every seller and saved every product one at a time; this does it
 * in two queries and reports what it changed so the job can be monitored.
 */
export async function unpublishExpiredSellerProducts(now = new Date()) {
  if (!(await addonEnabled("seller_subscription"))) return { sellers: 0, unpublished: 0 };

  const expired = await Shop.find(
    { packageInvalidAt: { $ne: null, $lte: now } },
    { sellerId: 1 },
  ).lean();
  if (expired.length === 0) return { sellers: 0, unpublished: 0 };

  const result = await Product.updateMany(
    { sellerId: { $in: expired.map((shop) => shop.sellerId) }, published: true },
    { published: false },
  );
  return { sellers: expired.length, unpublished: result.modifiedCount };
}
