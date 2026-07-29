import { Product } from "../models/Product.js";
import { Category, Brand } from "../models/Category.js";
import { Search } from "../models/Marketing.js";
import { Shop } from "../models/Shop.js";
import { logger } from "../config/logger.js";

// User input goes into a $regex, so any regex metacharacter it contains must be
// neutralised — an unescaped "(" or a nested quantifier is both a crash and a
// ReDoS vector against the search endpoint.
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface Suggestions {
  products: { id: string; name: string; slug: string; imageUrl?: string; basePrice: number }[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  shops: { id: string; name: string; slug: string }[];
}

// Typeahead for the header search box: a prefix match across the four things a
// shopper might be looking for, capped tightly because it fires on every keystroke.
export async function getSearchSuggestions(query: string, limit = 5): Promise<Suggestions> {
  const term = query.trim().slice(0, 80);
  if (term.length < 2) return { products: [], categories: [], brands: [], shops: [] };

  const rx = new RegExp(escapeRegex(term), "i");

  const [products, categories, brands, shops] = await Promise.all([
    Product.find({ published: true, approvalStatus: "approved", name: rx })
      .select("name slug images basePrice")
      .sort({ ratingAverage: -1 })
      .limit(limit),
    Category.find({ active: true, name: rx }).select("name slug").limit(limit),
    Brand.find({ active: true, name: rx }).select("name slug").limit(limit),
    Shop.find({ verified: true, name: rx }).select("name slug").limit(limit),
  ]);

  return {
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      imageUrl: p.images[0],
      basePrice: p.basePrice,
    })),
    categories: categories.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug })),
    brands: brands.map((b) => ({ id: String(b._id), name: b.name, slug: b.slug })),
    shops: shops.map((s) => ({ id: String(s._id), name: s.name, slug: s.slug })),
  };
}

// Fire-and-forget analytics write. Search must never fail because logging did,
// so this swallows its own errors rather than propagating them to the response.
export function recordSearch(query: string, resultCount: number, userId?: string | null) {
  const term = query.trim().slice(0, 120);
  if (term.length < 2) return;

  Search.create({ query: term.toLowerCase(), resultCount, userId: userId ?? null }).catch((err) => {
    logger.warn("Failed to record search term", err);
  });
}

// Most-searched terms, powering both the "popular searches" storefront widget and
// the admin report of what shoppers look for but don't find.
export async function getTopSearches(limit = 20, onlyZeroResults = false) {
  return Search.aggregate([
    ...(onlyZeroResults ? [{ $match: { resultCount: 0 } }] : []),
    {
      $group: {
        _id: "$query",
        count: { $sum: 1 },
        avgResults: { $avg: "$resultCount" },
        lastSearchedAt: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, query: "$_id", count: 1, avgResults: 1, lastSearchedAt: 1 } },
  ]);
}
