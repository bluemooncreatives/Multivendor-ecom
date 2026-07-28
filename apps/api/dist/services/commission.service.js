import { SellerPackagePayment } from "../models/Package.js";
import { BusinessSetting } from "../models/Settings.js";
const DEFAULT_COMMISSION_PERCENT = 10;
// Single source of truth for commission math, called from every payment path
// (checkout, refunds). The legacy app recalculated commission separately per
// gateway controller, so the rate could silently drift between COD/Stripe/etc.
export async function calculateCommission(sellerId, subtotal) {
    const activePackage = await SellerPackagePayment.findOne({
        sellerId,
        status: "paid",
        expiresAt: { $gt: new Date() },
    })
        .sort({ expiresAt: -1 })
        .populate("packageId");
    const override = activePackage?.packageId
        ?.commissionRateOverride;
    const rate = override ?? (await getDefaultCommissionPercent());
    const amount = Math.round(((subtotal * rate) / 100) * 100) / 100;
    return { rate, amount };
}
async function getDefaultCommissionPercent() {
    const settings = await BusinessSetting.findOne({ key: "business" });
    return settings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT;
}
//# sourceMappingURL=commission.service.js.map