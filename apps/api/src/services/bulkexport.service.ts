import Papa from "papaparse";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

// Columns mirror importProductsCsv's expected header exactly, so an exported file
// can be edited and re-uploaded without any manual reshaping. One row per variant,
// because that is the granularity stock and price actually live at.
export async function exportProductsCsv(filter: { sellerId?: string } = {}): Promise<string> {
  const products = await Product.find(filter.sellerId ? { sellerId: filter.sellerId } : {})
    .sort({ createdAt: -1 })
    .lean();

  const categoryIds = [...new Set(products.map((p) => String(p.categoryId)))];
  const categories = await Category.find({ _id: { $in: categoryIds } }, { slug: 1 }).lean();
  const slugById = new Map(categories.map((c) => [String(c._id), c.slug]));

  const rows = products.flatMap((product) =>
    product.variants.map((variant) => ({
      name: product.name,
      slug: product.slug,
      categorySlug: slugById.get(String(product.categoryId)) ?? "",
      description: product.description ?? "",
      basePrice: product.basePrice,
      stock: variant.stock,
      sku: variant.sku,
      tags: (product.tags ?? []).join(","),
      variantPrice: variant.price,
      published: product.published ? "yes" : "no",
      approvalStatus: product.approvalStatus,
    })),
  );

  return Papa.unparse(rows, {
    columns: [
      "name",
      "slug",
      "categorySlug",
      "description",
      "basePrice",
      "stock",
      "sku",
      "tags",
      "variantPrice",
      "published",
      "approvalStatus",
    ],
  });
}

// Reference sheets the bulk-upload UI offers for download, so a seller can look up
// the exact slug/id values the importer expects instead of guessing them.
export async function exportCategoriesCsv(): Promise<string> {
  const categories = await Category.find().sort({ level: 1, name: 1 }).lean();
  const byId = new Map(categories.map((c) => [String(c._id), c.name]));
  return Papa.unparse(
    categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      level: c.level,
      parent: c.parentId ? (byId.get(String(c.parentId)) ?? "") : "",
    })),
    { columns: ["id", "name", "slug", "level", "parent"] },
  );
}

export async function exportSellersCsv(): Promise<string> {
  const sellers = await User.find({ role: "seller" }).select("name email phone createdAt").sort({ name: 1 }).lean();
  return Papa.unparse(
    sellers.map((s) => ({
      id: String(s._id),
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      joinedAt: s.createdAt?.toISOString() ?? "",
    })),
    { columns: ["id", "name", "email", "phone", "joinedAt"] },
  );
}
