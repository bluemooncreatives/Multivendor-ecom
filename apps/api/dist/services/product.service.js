import { Product } from "../models/Product.js";
// Every filter is a top-level key on one object, so Mongo ANDs them all implicitly.
// The legacy app built this query with chained orWhere() calls that accidentally
// OR'd category/brand/price filters together with the search term — fixed here by
// construction: there is no orWhere-equivalent mixed into the same query object.
export async function searchProducts(params) {
    const filter = {
        published: true,
        approvalStatus: "approved",
    };
    if (params.categoryId)
        filter.categoryId = params.categoryId;
    if (params.brandId)
        filter.brandId = params.brandId;
    if (params.sellerId)
        filter.sellerId = params.sellerId;
    if (params.tags?.length)
        filter.tags = { $all: params.tags };
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
    const sortMap = {
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
//# sourceMappingURL=product.service.js.map