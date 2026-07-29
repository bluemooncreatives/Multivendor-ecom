import type { Request, Response } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { searchProducts } from "../services/product.service.js";
import { recordSearch } from "../services/search.service.js";
import { importProductsCsv } from "../services/bulkimport.service.js";
import { exportProductsCsv, exportCategoriesCsv, exportSellersCsv } from "../services/bulkexport.service.js";
import { assertSellerCanAddProduct } from "../services/quota.service.js";
import { ApiError } from "../middleware/errorHandler.js";

const variantInput = z.object({
  sku: z.string().min(1),
  attributes: z.record(z.string()).default({}),
  price: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  imageUrl: z.string().url().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220),
  categoryId: z.string(),
  brandId: z.string().optional(),
  description: z.string().default(""),
  images: z.array(z.string().url()).default([]),
  basePrice: z.number().min(0),
  currency: z.string().default("INR"),
  variants: z.array(variantInput).min(1),
  minOrderQty: z.number().int().min(1).default(1),
  isDigital: z.boolean().default(false),
  digitalFileUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : undefined)),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional(),
});

export async function searchProductsHandler(req: Request, res: Response) {
  const params = searchQuerySchema.parse(req.query);
  const result = await searchProducts(params);
  // Analytics only — deliberately not awaited so a slow write never delays results.
  if (params.q) recordSearch(params.q, result.total, req.user?.id);
  res.json(result);
}

export async function getProductsByIdsHandler(req: Request, res: Response) {
  const ids = String(req.query.ids ?? "")
    .split(",")
    .filter(Boolean)
    .slice(0, 10);
  const products = await Product.find({ _id: { $in: ids }, published: true });
  res.json({ items: products });
}

export async function getProductHandler(req: Request, res: Response) {
  const product = await Product.findOne({ slug: req.params.slug, published: true, approvalStatus: "approved" });
  if (!product) throw new ApiError(404, "Product not found");
  await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });
  res.json(product);
}

export async function createProductHandler(req: Request, res: Response) {
  await assertSellerCanAddProduct(req.user!.id);
  assertUniqueSkus(req.body.variants);

  const product = await Product.create({
    ...req.body,
    sellerId: req.user!.id,
    published: false,
    approvalStatus: "pending",
  });
  res.status(201).json(product);
}

// Edits that change what the shopper sees (name, images, description, pricing)
// send the listing back through moderation. Stock-only edits do not, so a seller
// can restock without their live listing disappearing from the storefront.
const MODERATED_FIELDS = ["name", "description", "images", "categoryId", "brandId", "tags"] as const;

export async function updateProductHandler(req: Request, res: Response) {
  const product = await Product.findOne({ _id: req.params.id, sellerId: req.user!.id });
  if (!product) throw new ApiError(404, "Product not found");
  if (req.body.variants) assertUniqueSkus(req.body.variants);

  const needsReview =
    product.approvalStatus === "approved" &&
    MODERATED_FIELDS.some((f) => req.body[f] !== undefined && JSON.stringify(req.body[f]) !== JSON.stringify(product.get(f)));

  Object.assign(product, req.body);
  if (needsReview) {
    product.approvalStatus = "pending";
    product.published = false;
  }
  await product.save();
  res.json(product);
}

// Duplicate SKUs inside one product would make variant-level stock updates
// ambiguous (arrayFilters would match several entries), so they are rejected up front.
function assertUniqueSkus(variants: { sku: string }[]) {
  const seen = new Set<string>();
  for (const variant of variants) {
    if (seen.has(variant.sku)) throw new ApiError(422, `Duplicate variant SKU: ${variant.sku}`);
    seen.add(variant.sku);
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  const deleted = await Product.findOneAndUpdate(
    { _id: req.params.id, sellerId: req.user!.id },
    { published: false },
  );
  if (!deleted) throw new ApiError(404, "Product not found");
  res.status(204).send();
}

// Legacy "duplicate product" silently dropped the variants array. Cloning here
// always deep-copies variants (with fresh SKUs) so stock/pricing survive intact.
export async function cloneProductHandler(req: Request, res: Response) {
  const original = await Product.findOne({ _id: req.params.id, sellerId: req.user!.id });
  if (!original) throw new ApiError(404, "Product not found");

  const clone = await Product.create({
    sellerId: original.sellerId,
    name: `${original.name} (Copy)`,
    slug: `${original.slug}-copy-${Date.now()}`,
    categoryId: original.categoryId,
    brandId: original.brandId,
    description: original.description,
    images: original.images,
    basePrice: original.basePrice,
    currency: original.currency,
    variants: original.variants.map((v) => ({ ...v.toObject(), sku: `${v.sku}-copy-${Date.now()}` })),
    minOrderQty: original.minOrderQty,
    isDigital: original.isDigital,
    digitalFileUrl: original.digitalFileUrl,
    tags: original.tags,
    published: false,
    approvalStatus: "pending",
  });

  res.status(201).json(clone);
}

export async function listSellerProductsHandler(req: Request, res: Response) {
  const products = await Product.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items: products });
}

export const approveProductSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function bulkImportProductsHandler(req: Request, res: Response) {
  if (!req.file) throw new ApiError(400, "A CSV file is required");
  const result = await importProductsCsv(req.user!.id, req.file.buffer);
  res.status(201).json(result);
}

export async function listPendingProductsHandler(_req: Request, res: Response) {
  const products = await Product.find({ approvalStatus: "pending" }).sort({ createdAt: -1 });
  res.json({ items: products });
}

export async function moderateProductHandler(req: Request, res: Response) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      approvalStatus: req.body.approved ? "approved" : "rejected",
      published: req.body.approved,
    },
    { new: true },
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
}

// --- Merchandising flags ------------------------------------------------------

export const productFlagsSchema = z
  .object({
    featured: z.boolean().optional(),
    todaysDeal: z.boolean().optional(),
    published: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one flag to update" });

// Sellers may only toggle `published` on their own listings; featured/todaysDeal
// are merchandising decisions reserved for staff, since they place a product on
// the storefront's paid-placement surfaces.
export async function updateProductFlagsHandler(req: Request, res: Response) {
  const isStaff = req.user!.role === "admin" || req.user!.role === "staff";
  const update: Record<string, boolean> = {};

  if (req.body.published !== undefined) update.published = req.body.published;
  if (req.body.featured !== undefined || req.body.todaysDeal !== undefined) {
    if (!isStaff) throw new ApiError(403, "Only staff can change featured or deal placement");
    if (req.body.featured !== undefined) update.featured = req.body.featured;
    if (req.body.todaysDeal !== undefined) update.todaysDeal = req.body.todaysDeal;
  }

  const filter = isStaff ? { _id: req.params.id } : { _id: req.params.id, sellerId: req.user!.id };
  const product = await Product.findOne(filter);
  if (!product) throw new ApiError(404, "Product not found");

  // Publishing is gated on moderation: an unapproved listing can never be pushed
  // live by flipping this flag (the legacy toggle bypassed approval entirely).
  if (update.published && product.approvalStatus !== "approved") {
    throw new ApiError(409, "This product must be approved before it can be published");
  }

  Object.assign(product, update);
  await product.save();
  res.json(product);
}

// --- Admin catalog ------------------------------------------------------------

// Every product regardless of publish/approval state, so staff can find and edit
// listings that never appear in the public search index.
export async function listAllProductsHandler(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 30);

  const filter: Record<string, unknown> = {};
  if (req.query.sellerId) filter.sellerId = req.query.sellerId;
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  if (req.query.published !== undefined) filter.published = req.query.published === "true";
  if (req.query.q) filter.name = { $regex: String(req.query.q).slice(0, 80), $options: "i" };

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pageSize });
}

// Staff edit of any seller's listing (the seller-scoped updateProductHandler
// deliberately refuses to touch products the requester does not own).
export async function adminUpdateProductHandler(req: Request, res: Response) {
  if (req.body.variants) assertUniqueSkus(req.body.variants);
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product);
}

export async function exportProductsHandler(req: Request, res: Response) {
  // Sellers always export only their own catalog, whatever the query string says.
  const sellerId = req.user!.role === "seller" ? req.user!.id : (req.query.sellerId as string | undefined);
  const csv = await exportProductsCsv(sellerId ? { sellerId } : {});
  res.header("Content-Type", "text/csv");
  res.attachment("products.csv");
  res.send(csv);
}

export async function exportCategoriesHandler(_req: Request, res: Response) {
  const csv = await exportCategoriesCsv();
  res.header("Content-Type", "text/csv");
  res.attachment("categories.csv");
  res.send(csv);
}

export async function exportSellersHandler(_req: Request, res: Response) {
  const csv = await exportSellersCsv();
  res.header("Content-Type", "text/csv");
  res.attachment("sellers.csv");
  res.send(csv);
}

// --- Variant helpers ----------------------------------------------------------

export const skuCombinationSchema = z.object({
  baseSku: z.string().min(1).max(40),
  basePrice: z.number().min(0),
  // e.g. { Color: ["Red","Blue"], Size: ["S","M"] } -> 4 variants
  attributes: z.record(z.array(z.string().min(1)).min(1)),
});

// Expands the chosen attribute values into the full cartesian product of variants,
// the way the legacy "generate SKU combinations" button did — but computed on the
// server so the client cannot invent variants with mismatched attribute sets.
export async function generateSkuCombinationsHandler(req: Request, res: Response) {
  const entries = Object.entries(req.body.attributes as Record<string, string[]>);

  const total = entries.reduce((n, [, values]) => n * values.length, 1);
  if (total > 200) throw new ApiError(422, `That would generate ${total} variants; the limit is 200`);

  let combos: Record<string, string>[] = [{}];
  for (const [name, values] of entries) {
    combos = combos.flatMap((combo) => values.map((value) => ({ ...combo, [name]: value })));
  }

  const variants = combos.map((attributes) => ({
    sku: [req.body.baseSku, ...Object.values(attributes)]
      .join("-")
      .replace(/\s+/g, "")
      .toUpperCase(),
    attributes,
    price: req.body.basePrice,
    stock: 0,
  }));

  res.json({ variants });
}

// Resolves the live price/stock for one selected variant — used by the product
// page when a shopper switches colour/size.
export async function getVariantPriceHandler(req: Request, res: Response) {
  const product = await Product.findOne({ _id: req.params.id, published: true });
  if (!product) throw new ApiError(404, "Product not found");

  const variant = product.variants.find((v) => v.sku === req.query.sku);
  if (!variant) throw new ApiError(404, "Variant not found");

  res.json({
    sku: variant.sku,
    price: variant.price,
    comparePrice: variant.comparePrice,
    // Reserved units are held for in-flight orders and are not purchasable.
    available: Math.max(0, variant.stock - variant.reserved),
    imageUrl: variant.imageUrl,
  });
}
