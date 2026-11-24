import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Shop } from "../models/Shop.js";
import { Order } from "../models/Order.js";
import { SellerLedger } from "../models/Ledger.js";
import { Wishlist } from "../models/Address.js";
import { User } from "../models/User.js";

/**
 * Resolves `?categoryId=` into that category and everything filed beneath it.
 * The legacy reports filtered on `category_id` alone, which missed every product
 * filed under a sub- or sub-sub-category of the one being reported on.
 */
async function categoryFilter(req: Request): Promise<Record<string, unknown>> {
  const { categoryId } = req.query as { categoryId?: string };
  if (!categoryId || !Types.ObjectId.isValid(categoryId)) return {};
  const descendants = await Category.find({ ancestors: categoryId }, { _id: 1 });
  return { categoryId: { $in: [new Types.ObjectId(categoryId), ...descendants.map((c) => c._id)] } };
}

function pageParams(req: Request, defaultSize = 200) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(1000, Math.max(1, Number(req.query.pageSize) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// Every variant across every product, flattened, sorted lowest-stock-first —
// what the legacy "stock report" DataTable showed, with its category filter.
export async function stockReportHandler(req: Request, res: Response) {
  const filter = await categoryFilter(req);
  const { page, pageSize, skip } = pageParams(req);

  // Flattened and sorted in the database: the previous version read every product
  // and every variant into memory before sorting, which a real catalogue outgrows.
  const rows = await Product.aggregate([
    { $match: filter },
    { $unwind: "$variants" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: "$name",
        sellerId: 1,
        addedBy: 1,
        sku: "$variants.sku",
        stock: "$variants.stock",
        reserved: "$variants.reserved",
        available: { $subtract: ["$variants.stock", "$variants.reserved"] },
      },
    },
    { $sort: { available: 1, productName: 1 } },
    { $skip: skip },
    { $limit: pageSize },
  ]);

  const [totals] = await Product.aggregate([
    { $match: filter },
    { $unwind: "$variants" },
    { $group: { _id: null, variants: { $sum: 1 }, units: { $sum: "$variants.stock" } } },
  ]);

  res.json({ items: rows, page, pageSize, total: totals?.variants ?? 0, totalUnits: totals?.units ?? 0 });
}

/**
 * Products ranked by units sold (legacy `in_house_sale_report`, which listed them
 * by `num_of_sale`). `?scope=in_house` restricts it to admin-owned listings, which
 * is what that report showed; `seller` restricts it to vendor listings.
 */
export async function productSalesReportHandler(req: Request, res: Response) {
  const { scope } = req.query as { scope?: string };
  const filter: Record<string, unknown> = {
    ...(await categoryFilter(req)),
    ...(scope === "in_house" ? { addedBy: "admin" } : scope === "seller" ? { addedBy: "seller" } : {}),
  };
  const { page, pageSize, skip } = pageParams(req, 50);

  const [items, total] = await Promise.all([
    Product.find(filter, { name: 1, slug: 1, numOfSale: 1, basePrice: 1, addedBy: 1, sellerId: 1, categoryId: 1 })
      .populate("categoryId", "name")
      .populate("sellerId", "name")
      .sort({ numOfSale: -1, name: 1 })
      .skip(skip)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  res.json({ items, page, pageSize, total });
}

/**
 * Sellers with their verification state and catalogue size (legacy
 * `seller_report`, filtered by `verification_status`).
 */
export async function sellerReportHandler(req: Request, res: Response) {
  const { verificationStatus } = req.query as { verificationStatus?: string };
  const filter = ["pending", "approved", "rejected"].includes(verificationStatus ?? "")
    ? { verificationStatus }
    : {};

  const shops = await Shop.find(filter)
    .populate("sellerId", "name email phone banned createdAt")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const productCounts = await Product.aggregate([
    { $match: { sellerId: { $in: shops.map((shop) => shop.sellerId) } } },
    { $group: { _id: "$sellerId", products: { $sum: 1 }, published: { $sum: { $cond: ["$published", 1, 0] } } } },
  ]);
  const byId = new Map(productCounts.map((row) => [String(row._id), row]));

  res.json({
    items: shops.map((shop) => ({
      shopId: shop._id,
      name: shop.name,
      slug: shop.slug,
      seller: shop.sellerId,
      verificationStatus: shop.verificationStatus,
      verified: shop.verified,
      packageInvalidAt: shop.packageInvalidAt ?? null,
      remainingUploads: shop.remainingUploads ?? 0,
      products: byId.get(String((shop.sellerId as { _id?: unknown })?._id ?? shop.sellerId))?.products ?? 0,
      publishedProducts: byId.get(String((shop.sellerId as { _id?: unknown })?._id ?? shop.sellerId))?.published ?? 0,
    })),
  });
}

function parseDateRange(req: Request) {
  const { from, to } = req.query as { from?: string; to?: string };
  return {
    ...(from ? { $gte: new Date(from) } : {}),
    ...(to ? { $lte: new Date(to) } : {}),
  };
}

export async function salesReportHandler(req: Request, res: Response) {
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
export async function sellerSalesReportHandler(req: Request, res: Response) {
  const { sellerId } = req.query as { sellerId?: string };
  // An ObjectId, not the raw string: `$match` does not coerce, so the previous
  // version's ?sellerId= filter matched nothing and silently reported every seller.
  const scoped = sellerId && Types.ObjectId.isValid(sellerId) ? new Types.ObjectId(sellerId) : null;

  const rows = await SellerLedger.aggregate([
    ...(scoped ? [{ $match: { sellerId: scoped } }] : []),
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

// Products with the most wishlist adds, most-wished-for first, with the legacy
// report's category filter.
export async function wishlistReportHandler(req: Request, res: Response) {
  const filter = await categoryFilter(req);

  const rows = await Wishlist.aggregate([
    { $group: { _id: "$productId", count: { $sum: 1 } } },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    // The category filter is applied after the join, since the wishlist row itself
    // does not know the product's category.
    ...(filter.categoryId ? [{ $match: { "product.categoryId": filter.categoryId } }] : []),
    { $sort: { count: -1 } },
    { $limit: 100 },
    { $project: { productId: "$_id", name: "$product.name", slug: "$product.slug", count: 1, _id: 0 } },
  ]);
  res.json({ items: rows });
}

export async function customerGrowthReportHandler(req: Request, res: Response) {
  const dateFilter = parseDateRange(req);
  const match = { role: "customer", ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) };
  const count = await User.countDocuments(match);
  res.json({ newCustomers: count });
}
