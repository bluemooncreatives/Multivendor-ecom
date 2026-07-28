import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { SellerLedger } from "../models/Ledger.js";
import { Wishlist } from "../models/Address.js";
import { User } from "../models/User.js";
// Every variant across every product, flattened, sorted lowest-stock-first —
// what the legacy "stock report" DataTable showed.
export async function stockReportHandler(_req, res) {
    const products = await Product.find({}, { name: 1, sellerId: 1, variants: 1 });
    const rows = products.flatMap((p) => p.variants.map((v) => ({
        productId: p._id,
        productName: p.name,
        sellerId: p.sellerId,
        sku: v.sku,
        stock: v.stock,
        reserved: v.reserved,
        available: v.stock - v.reserved,
    })));
    rows.sort((a, b) => a.available - b.available);
    res.json({ items: rows });
}
function parseDateRange(req) {
    const { from, to } = req.query;
    return {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
    };
}
export async function salesReportHandler(req, res) {
    const dateFilter = parseDateRange(req);
    const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const [totals] = await Order.aggregate([
        { $match: match },
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$grandTotal" }, discount: { $sum: "$discount" }, tax: { $sum: "$tax" } } },
    ]);
    res.json({
        orders: totals?.orders ?? 0,
        revenue: totals?.revenue ?? 0,
        discount: totals?.discount ?? 0,
        tax: totals?.tax ?? 0,
    });
}
// Per-seller sales + commission, sourced from the immutable ledger (never a
// cached balance), optionally scoped to one seller via ?sellerId=.
export async function sellerSalesReportHandler(req, res) {
    const { sellerId } = req.query;
    const rows = await SellerLedger.aggregate([
        ...(sellerId ? [{ $match: { sellerId: sellerId } }] : []),
        {
            $group: {
                _id: "$sellerId",
                sales: { $sum: { $cond: [{ $eq: ["$type", "sale"] }, "$amount", 0] } },
                commission: { $sum: { $cond: [{ $eq: ["$type", "commission"] }, { $abs: "$amount" }, 0] } },
                refunds: { $sum: { $cond: [{ $eq: ["$type", "refund"] }, { $abs: "$amount" }, 0] } },
            },
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "seller" } },
        { $unwind: "$seller" },
        { $project: { sellerId: "$_id", sellerName: "$seller.name", sales: 1, commission: 1, refunds: 1, _id: 0 } },
        { $sort: { sales: -1 } },
    ]);
    res.json({ items: rows });
}
// Products with the most wishlist adds, most-wished-for first.
export async function wishlistReportHandler(_req, res) {
    const rows = await Wishlist.aggregate([
        { $group: { _id: "$productId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $project: { productId: "$_id", name: "$product.name", count: 1, _id: 0 } },
    ]);
    res.json({ items: rows });
}
export async function customerGrowthReportHandler(req, res) {
    const dateFilter = parseDateRange(req);
    const match = { role: "customer", ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) };
    const count = await User.countDocuments(match);
    res.json({ newCustomers: count });
}
//# sourceMappingURL=report.controller.js.map