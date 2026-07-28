import { randomBytes } from "node:crypto";
import { z } from "zod";
import { AffiliateUser, AffiliateConfig, AffiliateEarningDetail, AffiliateWithdrawRequest, } from "../models/Affiliate.js";
import { ApiError } from "../middleware/errorHandler.js";
export async function getAffiliateConfigHandler(_req, res) {
    const config = (await AffiliateConfig.findOne()) ?? (await AffiliateConfig.create({}));
    res.json(config);
}
export async function joinAffiliateHandler(req, res) {
    const existing = await AffiliateUser.findOne({ userId: req.user.id });
    if (existing)
        return res.json(existing);
    const referralCode = randomBytes(4).toString("hex");
    const affiliate = await AffiliateUser.create({ userId: req.user.id, referralCode, status: "pending" });
    res.status(201).json(affiliate);
}
export async function getMyAffiliateHandler(req, res) {
    const affiliate = await AffiliateUser.findOne({ userId: req.user.id });
    if (!affiliate)
        throw new ApiError(404, "You have not joined the affiliate program yet");
    res.json(affiliate);
}
export async function listMyAffiliateEarningsHandler(req, res) {
    const affiliate = await AffiliateUser.findOne({ userId: req.user.id });
    if (!affiliate)
        throw new ApiError(404, "You have not joined the affiliate program yet");
    const items = await AffiliateEarningDetail.find({ affiliateUserId: affiliate._id }).sort({ createdAt: -1 });
    res.json({ items });
}
export const affiliateWithdrawSchema = z.object({
    amount: z.number().min(1),
    method: z.enum(["bank_transfer", "wallet", "manual"]),
    bankDetails: z.record(z.unknown()).optional(),
});
export async function createAffiliateWithdrawHandler(req, res) {
    const affiliate = await AffiliateUser.findOne({ userId: req.user.id });
    if (!affiliate)
        throw new ApiError(404, "You have not joined the affiliate program yet");
    if (req.body.amount > affiliate.availableBalance)
        throw new ApiError(400, "Amount exceeds your available balance");
    const request = await AffiliateWithdrawRequest.create({ ...req.body, affiliateUserId: affiliate._id });
    res.status(201).json(request);
}
//# sourceMappingURL=affiliate.controller.js.map