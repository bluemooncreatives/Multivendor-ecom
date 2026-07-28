import type { Request, Response } from "express";
import { z } from "zod";
import { Product } from "../models/Product.js";
import { searchProducts } from "../services/product.service.js";
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
  res.json(result);
}

export async function getProductHandler(req: Request, res: Response) {
  const product = await Product.findOne({ slug: req.params.slug, published: true, approvalStatus: "approved" });
  if (!product) throw new ApiError(404, "Product not found");
  await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });
  res.json(product);
}

export async function createProductHandler(req: Request, res: Response) {
  const product = await Product.create({
    ...req.body,
    sellerId: req.user!.id,
    published: false,
    approvalStatus: "pending",
  });
  res.status(201).json(product);
}

export async function updateProductHandler(req: Request, res: Response) {
  const product = await Product.findOne({ _id: req.params.id, sellerId: req.user!.id });
  if (!product) throw new ApiError(404, "Product not found");
  Object.assign(product, req.body);
  await product.save();
  res.json(product);
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
