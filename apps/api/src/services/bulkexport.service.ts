import Papa from "papaparse";
import { Category, Brand } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

// Columns mirror importProductsCsv's expected header exactly, so an exported file
// can be edited and re-uploaded without any manual reshaping. One row per variant,
// because that is the granularity stock and price actually live at.
export async function exportProductsCsv(filter: { sellerId?: string } = {}): Promise<string> {
  const products = await Product.find(filter.sellerId ? { sellerId: filter.sellerId } : {})
    .sort({ createdAt: -1 })
    .lean();

  // A product stores only its deepest category; the coarser levels are recovered
  // from that node's ancestors, so one lookup table covers all three columns.
  const categories = await Category.find({}, { slug: 1, ancestors: 1 }).lean();
  const categoryById = new Map(categories.map((c) => [String(c._id), c]));

  const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean).map(String))];
  const brands = await Brand.find({ _id: { $in: brandIds } }, { slug: 1 }).lean();
  const brandSlugById = new Map(brands.map((b) => [String(b._id), b.slug]));

  /** Root -> ... -> chosen node, as slugs. */
  function taxonomySlugs(categoryId: unknown): [string, string, string] {
    const node = categoryById.get(String(categoryId));
    if (!node) return ["", "", ""];
    const chain = [...(node.ancestors ?? []).map(String), String(node._id)].map(
      (id) => categoryById.get(id)?.slug ?? "",
    );
    return [chain[0] ?? "", chain[1] ?? "", chain[2] ?? ""];
  }

  const rows = products.flatMap((product) => {
    const [categorySlug, subCategorySlug, subSubCategorySlug] = taxonomySlugs(product.categoryId);

    return product.variants.map((variant) => ({
      name: product.name,
      slug: product.slug,
      // Coarsest-first, matching the import header exactly.
      categorySlug,
      subCategorySlug,
      subSubCategorySlug,
      brandSlug: product.brandId ? (brandSlugById.get(String(product.brandId)) ?? "") : "",
      description: product.description ?? "",
      basePrice: product.basePrice,
      purchasePrice: product.purchasePrice ?? 0,
      stock: variant.stock,
      sku: variant.sku,
      unit: product.unit ?? "",
      barcode: product.barcode ?? "",
      discount: product.discount ?? 0,
      discountType: product.discountType ?? "",
      tax: product.tax ?? "",
      taxType: product.taxType ?? "",
      shippingType: product.shippingType ?? "",
      shippingCost: product.shippingCost ?? 0,
      minOrderQty: product.minOrderQty ?? 1,
      videoProvider: product.videoProvider ?? "",
      videoLink: product.videoLink ?? "",
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      tags: (product.tags ?? []).join(","),
      variantPrice: variant.price,
      published: product.published ? "yes" : "no",
      approvalStatus: product.approvalStatus,
    }));
  });

  return Papa.unparse(rows, {
    columns: [
      "name",
      "slug",
      "categorySlug",
      "subCategorySlug",
      "subSubCategorySlug",
      "brandSlug",
      "description",
      "basePrice",
      "purchasePrice",
      "stock",
      "sku",
      "unit",
      "barcode",
      "discount",
      "discountType",
      "tax",
      "taxType",
      "shippingType",
      "shippingCost",
      "minOrderQty",
      "videoProvider",
      "videoLink",
      "metaTitle",
      "metaDescription",
      "tags",
      // Read-only columns: the importer ignores these, they are for reference.
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

// Brand reference sheet, so the importer's brandSlug column can be filled from a
// known-good list rather than guessed.
export async function exportBrandsCsv(): Promise<string> {
  const brands = await Brand.find().sort({ name: 1 }).lean();
  const categories = await Category.find({}, { name: 1 }).lean();
  const nameById = new Map(categories.map((c) => [String(c._id), c.name]));

  return Papa.unparse(
    brands.map((b) => ({
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      categories: (b.categoryIds ?? []).map((id) => nameById.get(String(id)) ?? "").filter(Boolean).join(" | "),
      active: b.active ? "yes" : "no",
    })),
    { columns: ["id", "name", "slug", "categories", "active"] },
  );
}

export async function exportSellersCsv(): Promise<string> {
  return exportUsersCsv("seller");
}

export async function exportCustomersCsv(): Promise<string> {
  return exportUsersCsv("customer");
}

async function exportUsersCsv(role: "seller" | "customer"): Promise<string> {
  const users = await User.find({ role }).select("name email phone banned createdAt").sort({ name: 1 }).lean();
  return Papa.unparse(
    users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      banned: u.banned ? "yes" : "no",
      joinedAt: u.createdAt?.toISOString() ?? "",
    })),
    { columns: ["id", "name", "email", "phone", "banned", "joinedAt"] },
  );
}
