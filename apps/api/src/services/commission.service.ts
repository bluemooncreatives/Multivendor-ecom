import { SellerPackagePayment } from "../models/Package.js";
import { BusinessSetting } from "../models/Settings.js";
import { Category } from "../models/Category.js";

const DEFAULT_COMMISSION_PERCENT = 10;

// Single source of truth for commission math, called from every payment path
// (checkout, refunds). The legacy app recalculated commission separately per
// gateway controller, so the rate could silently drift between COD/Stripe/etc.
//
// Precedence, highest first: the seller's active package override, then the
// category rate when category-based commission is enabled, then the global rate.
// `sellerId` is null for admin-owned products, which carry no commission at all.
export async function calculateCommission(
  sellerId: string | null,
  subtotal: number,
  categoryId?: string | null,
): Promise<{ rate: number; amount: number }> {
  if (!sellerId) return { rate: 0, amount: 0 };

  const activePackage = await SellerPackagePayment.findOne({
    sellerId,
    status: "paid",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .populate("packageId");

  const override = (activePackage?.packageId as unknown as { commissionRateOverride?: number } | null)
    ?.commissionRateOverride;

  const rate = override ?? (await resolveBaseRate(categoryId));
  const amount = Math.round(((subtotal * rate) / 100) * 100) / 100;

  return { rate, amount };
}

async function resolveBaseRate(categoryId?: string | null): Promise<number> {
  const settings = await BusinessSetting.findOne({ key: "business" });
  const globalRate = settings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT;

  if (!categoryId || !settings?.activation?.categoryBasedCommission) return globalRate;

  const category = await Category.findById(categoryId, { commissionRate: 1 });
  return category?.commissionRate ?? globalRate;
}
