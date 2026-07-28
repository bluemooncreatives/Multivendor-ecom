import { Wallet, WalletTransaction } from "../models/Wallet.js";
export async function getMyWalletHandler(req, res) {
    const wallet = (await Wallet.findOne({ userId: req.user.id })) ?? (await Wallet.create({ userId: req.user.id }));
    res.json(wallet);
}
export async function listMyWalletHistoryHandler(req, res) {
    const items = await WalletTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ items });
}
//# sourceMappingURL=wallet.controller.js.map