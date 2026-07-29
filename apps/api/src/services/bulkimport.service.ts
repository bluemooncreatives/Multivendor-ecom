import Papa from "papaparse";
import { Category, Brand } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

// Column set matches the legacy XLSX importer, plus the fields the rewrite added.
// Every optional column may be blank — only name/slug/categorySlug/basePrice/sku
// are required.
interface CsvRow {
  name: string;
  slug: string;
  categorySlug: string;
  subCategorySlug?: string;
  subSubCategorySlug?: string;
  brandSlug?: string;
  description?: string;
  basePrice: string;
  purchasePrice?: string;
  stock: string;
  sku: string;
  unit?: string;
  barcode?: string;
  discount?: string;
  discountType?: string;
  tax?: string;
  taxType?: string;
  shippingType?: string;
  shippingCost?: string;
  minOrderQty?: string;
  videoProvider?: string;
  videoLink?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string;
}

export interface BulkImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

/** Blank cells arrive as "" — treat those as absent rather than as zero. */
function optionalNumber(value: string | undefined, fallback: number | null = null): number | null {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function optionalEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  const normalised = value?.trim().toLowerCase() as T | undefined;
  return normalised && allowed.includes(normalised) ? normalised : fallback;
}

// One malformed row must not sink the whole batch — each row succeeds or is
// individually reported as skipped, so a seller can fix and re-upload just the bad rows.
export async function importProductsCsv(
  sellerId: string | null,
  csvBuffer: Buffer,
  options: { addedBy?: "admin" | "seller" } = {},
): Promise<BulkImportResult> {
  const parsed = Papa.parse<CsvRow>(csvBuffer.toString("utf8"), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new ApiError(400, `CSV parse error: ${parsed.errors[0]!.message}`);
  }

  // Slug -> document, resolved once up front; per-row lookups would issue one
  // query per column per row on a file that can hold thousands of rows.
  const categories = await Category.find({}, { slug: 1, ancestors: 1 }).lean();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const brands = await Brand.find({}, { slug: 1 }).lean();
  const brandBySlug = new Map(brands.map((b) => [b.slug, b._id]));

  const result: BulkImportResult = { created: 0, skipped: [] };

  for (const [index, row] of parsed.data.entries()) {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header row

    const rootCategory = categoryBySlug.get(row.categorySlug?.trim());
    if (!row.name || !row.slug || !rootCategory || !row.basePrice || !row.sku) {
      result.skipped.push({ row: rowNumber, reason: "Missing required field or unknown categorySlug" });
      continue;
    }

    // The deepest level named in the row wins, mirroring how the product form
    // normalises taxonomy. Each level must actually descend from the one above it.
    const subCategory = row.subCategorySlug?.trim() ? categoryBySlug.get(row.subCategorySlug.trim()) : undefined;
    const subSubCategory = row.subSubCategorySlug?.trim()
      ? categoryBySlug.get(row.subSubCategorySlug.trim())
      : undefined;

    if (row.subCategorySlug?.trim() && !subCategory) {
      result.skipped.push({ row: rowNumber, reason: `Unknown subCategorySlug: ${row.subCategorySlug}` });
      continue;
    }
    if (row.subSubCategorySlug?.trim() && !subSubCategory) {
      result.skipped.push({ row: rowNumber, reason: `Unknown subSubCategorySlug: ${row.subSubCategorySlug}` });
      continue;
    }

    const deepest = subSubCategory ?? subCategory ?? rootCategory;
    const chain = [...(deepest.ancestors ?? []).map(String), String(deepest._id)];
    const sameBranch = [rootCategory, subCategory, subSubCategory]
      .filter(Boolean)
      .every((node) => chain.includes(String(node!._id)));
    if (!sameBranch) {
      result.skipped.push({ row: rowNumber, reason: "Category columns are not in the same branch" });
      continue;
    }

    const price = Number(row.basePrice);
    const stock = optionalNumber(row.stock, 0);
    if (Number.isNaN(price) || stock === null) {
      result.skipped.push({ row: rowNumber, reason: "basePrice/stock must be numbers" });
      continue;
    }

    let brandId = null;
    if (row.brandSlug?.trim()) {
      brandId = brandBySlug.get(row.brandSlug.trim()) ?? null;
      if (!brandId) {
        result.skipped.push({ row: rowNumber, reason: `Unknown brandSlug: ${row.brandSlug}` });
        continue;
      }
    }

    try {
      await Product.create({
        sellerId,
        addedBy: options.addedBy ?? "seller",
        name: row.name,
        slug: row.slug,
        categoryId: chain[chain.length - 1],
        subCategoryId: chain.length > 1 ? chain[1] : null,
        subSubCategoryId: chain.length > 2 ? chain[2] : null,
        brandId,
        description: row.description ?? "",
        basePrice: price,
        purchasePrice: optionalNumber(row.purchasePrice, 0),
        unit: row.unit?.trim() || "pc",
        barcode: row.barcode?.trim() || null,
        discount: optionalNumber(row.discount, 0),
        discountType: optionalEnum(row.discountType, ["flat", "percent"] as const, "percent"),
        tax: optionalNumber(row.tax),
        taxType: optionalEnum(row.taxType, ["flat", "percent"] as const, "percent"),
        shippingType: optionalEnum(row.shippingType, ["free", "flat_rate"] as const, "free"),
        shippingCost: optionalNumber(row.shippingCost, 0),
        minOrderQty: optionalNumber(row.minOrderQty, 1),
        // Provider only matters when there is a link; defaulting it otherwise
        // would tag every imported product as having a YouTube video.
        videoProvider: row.videoLink?.trim()
          ? optionalEnum(row.videoProvider, ["youtube", "dailymotion", "vimeo"] as const, "youtube")
          : null,
        videoLink: row.videoLink?.trim() || null,
        metaTitle: row.metaTitle?.trim() || null,
        metaDescription: row.metaDescription?.trim() || null,
        variants: [{ sku: row.sku, attributes: {}, price, stock }],
        tags: row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        // Admin imports are trusted and go live; seller imports queue for review.
        published: options.addedBy === "admin",
        approvalStatus: options.addedBy === "admin" ? "approved" : "pending",
      });
      result.created += 1;
    } catch (err) {
      result.skipped.push({ row: rowNumber, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return result;
}
