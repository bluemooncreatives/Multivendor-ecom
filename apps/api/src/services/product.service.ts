import { FilterQuery } from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  subCategoryId?: string;
  subSubCategoryId?: string;
  colorId?: string;
  attributes?: Record<string, string>;
  brandId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
}

// Every filter is a top-level key on one object, so Mongo ANDs them all implicitly.
// The legacy app built this query with chained orWhere() calls that accidentally
// OR'd category/brand/price filters together with the search term — fixed here by
// construction: there is no orWhere-equivalent mixed into the same query object.
export async function searchProducts(params: ProductSearchParams) {
  const filter: FilterQuery<typeof Product> = {
    published: true,
    approvalStatus: "approved",
  };

  // Browsing a root or mid-level category must include everything filed beneath it.
  // Products store only their deepest node in categoryId, so the filter expands to
  // that node plus its whole subtree, found via the ancestors index in one query.
  if (params.subSubCategoryId) {
    filter.categoryId = params.subSubCategoryId;
  } else if (params.subCategoryId || params.categoryId) {
    const rootId = params.subCategoryId ?? params.categoryId!;
    const descendants = await Category.find({ ancestors: rootId }, { _id: 1 });
    filter.categoryId = { $in: [rootId, ...descendants.map((c) => c._id)] };
  }

  if (params.colorId) filter.colors = params.colorId;
  // Variant attribute facets (size, material, …): a product matches if any one of
  // its variants carries the requested value.
  for (const [name, value] of Object.entries(params.attributes ?? {})) {
    filter[`variants.attributes.${name}`] = value;
  }
  if (params.brandId) filter.brandId = params.brandId;
  if (params.sellerId) filter.sellerId = params.sellerId;
  if (params.tags?.length) filter.tags = { $all: params.tags };
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    filter.basePrice = {
      ...(params.minPrice !== undefined ? { $gte: params.minPrice } : {}),
      ...(params.maxPrice !== undefined ? { $lte: params.maxPrice } : {}),
    };
  }
  if (params.q) {
    filter.$text = { $search: params.q };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24));

  const sortMap: Record<NonNullable<ProductSearchParams["sort"]>, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    rating: { ratingAverage: -1 },
  };
  const sort = sortMap[params.sort ?? "newest"];

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  return { items, page, pageSize, total };
}
