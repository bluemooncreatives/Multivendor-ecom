import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { User } from "../models/User.js";
import { Shop } from "../models/Shop.js";
import { Product } from "../models/Product.js";
import { SellerLedger, SellerPayout } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";

// Sellers joined with their shop, so the admin list can show verification state
// and storefront name without a second round-trip per row.
export async function listSellersHandler(req: Request, res: Response) {
  const { verificationStatus, q } = req.query as { verificationStatus?: string; q?: string };

  const filter: Record<string, unknown> = { role: "seller" };
  if (q) {
    const rx = { $regex: String(q).slice(0, 80), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const sellers = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  const shops = await Shop.find({ sellerId: { $in: sellers.map((s) => s._id) } });
  const shopBySeller = new Map(shops.map((s) => [String(s.sellerId), s]));

  const items = sellers
    .map((seller) => ({ seller, shop: shopBySeller.get(String(seller._id)) ?? null }))
    .filter((row) => !verificationStatus || row.shop?.verificationStatus === verificationStatus);

  res.json({ items });
}

// Everything an admin needs to decide on a seller: shop, submitted documents,
// catalog size, lifetime sales and current ledger balance.
export async function getSellerDetailHandler(req: Request, res: Response) {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw new ApiError(404, "Seller not found");

  const sellerObjectId = new mongoose.Types.ObjectId(String(req.params.id));
  const [shop, productCount, ledger, payouts] = await Promise.all([
    Shop.findOne({ sellerId: seller._id }),
    Product.countDocuments({ sellerId: seller._id }),
    SellerLedger.aggregate([
      { $match: { sellerId: sellerObjectId } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    SellerPayout.find({ sellerId: seller._id }).sort({ createdAt: -1 }).limit(50),
  ]);

  const byType = Object.fromEntries(ledger.map((row: { _id: string; total: number }) => [row._id, row.total]));
  res.json({
    seller,
    shop,
    productCount,
    totals: {
      sales: byType.sale ?? 0,
      commission: byType.commission ?? 0,
      refunds: byType.refund ?? 0,
      withdrawn: byType.withdrawal ?? 0,
      balance: ledger.reduce((sum: number, row: { total: number }) => sum + row.total, 0),
    },
    payouts,
  });
}

// A seller's ledger and payout history, viewed by an admin.
export async function getSellerPaymentHistoryHandler(req: Request, res: Response) {
  const [entries, payouts] = await Promise.all([
    SellerLedger.find({ sellerId: req.params.id }).sort({ createdAt: -1 }).limit(200),
    SellerPayout.find({ sellerId: req.params.id }).populate("paidBy", "name email").sort({ createdAt: -1 }).limit(200),
  ]);
  res.json({ entries, payouts });
}

export const payoutSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(["bank_transfer", "wallet", "manual", "cash"]),
  reference: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
  // Supplied by the client so a double-submitted payout form settles only once.
  idempotencyKey: z.string().min(8).max(100),
});

// Direct commission settlement to a seller. The payout and its matching ledger
// row are written in one transaction and keyed on a client-supplied idempotency
// key, so a retried request can never pay the same seller twice — the legacy
// pay_to_seller endpoint had neither guard and double-paid on a slow form submit.
export async function payToSellerHandler(req: Request, res: Response) {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw new ApiError(404, "Seller not found");

  const sellerObjectId = new mongoose.Types.ObjectId(String(req.params.id));
  const [balanceRow] = await SellerLedger.aggregate([
    { $match: { sellerId: sellerObjectId } },
    { $group: { _id: null, balance: { $sum: "$amount" } } },
  ]);
  const balance = balanceRow?.balance ?? 0;
  if (req.body.amount > balance) {
    throw new ApiError(400, `Payout exceeds the seller's outstanding balance of ${balance}`);
  }

  const session = await mongoose.startSession();
  try {
    let payout: unknown;
    await session.withTransaction(async () => {
      try {
        const [created] = await SellerPayout.create(
          [
            {
              sellerId: seller._id,
              amount: req.body.amount,
              method: req.body.method,
              reference: req.body.reference,
              note: req.body.note,
              paidBy: req.user!.id,
              idempotencyKey: req.body.idempotencyKey,
            },
          ],
          { session },
        );
        payout = created;
      } catch (err) {
        if ((err as { code?: number }).code === 11000) {
          throw new ApiError(409, "This payout has already been recorded");
        }
        throw err;
      }

      await SellerLedger.create(
        [
          {
            sellerId: seller._id,
            type: "withdrawal",
            amount: -req.body.amount,
            note: req.body.note ?? "Commission payout",
          },
        ],
        { session },
      );
    });
    res.status(201).json(payout);
  } finally {
    await session.endSession();
  }
}

export async function listAllPayoutsHandler(_req: Request, res: Response) {
  const items = await SellerPayout.find()
    .populate("sellerId", "name email")
    .populate("paidBy", "name email")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ items });
}

// Shops awaiting a verification decision — the admin's review queue.
export async function listPendingShopVerificationsHandler(_req: Request, res: Response) {
  const items = await Shop.find({ verificationStatus: "pending", verificationDocs: { $ne: [] } })
    .populate("sellerId", "name email phone")
    .sort({ updatedAt: -1 });
  res.json({ items });
}
