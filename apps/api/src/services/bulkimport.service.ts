import Papa from "papaparse";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";

interface CsvRow {
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  basePrice: string;
  stock: string;
  sku: string;
  tags?: string;
}

export interface BulkImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

// One malformed row must not sink the whole batch — each row succeeds or is
// individually reported as skipped, so a seller can fix and re-upload just the bad rows.
export async function importProductsCsv(sellerId: string, csvBuffer: Buffer): Promise<BulkImportResult> {
  const parsed = Papa.parse<CsvRow>(csvBuffer.toString("utf8"), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new ApiError(400, `CSV parse error: ${parsed.errors[0]!.message}`);
  }

  const categories = await Category.find({}, { slug: 1 });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  const result: BulkImportResult = { created: 0, skipped: [] };

  for (const [index, row] of parsed.data.entries()) {
    const rowNumber = index + 2; // +1 for 0-index, +1 for header row
    const categoryId = categoryBySlug.get(row.categorySlug);
    if (!row.name || !row.slug || !categoryId || !row.basePrice || !row.sku) {
      result.skipped.push({ row: rowNumber, reason: "Missing required field or unknown categorySlug" });
      continue;
    }

    const price = Number(row.basePrice);
    const stock = Number(row.stock ?? 0);
    if (Number.isNaN(price) || Number.isNaN(stock)) {
      result.skipped.push({ row: rowNumber, reason: "basePrice/stock must be numbers" });
      continue;
    }

    try {
      await Product.create({
        sellerId,
        name: row.name,
        slug: row.slug,
        categoryId,
        description: row.description ?? "",
        basePrice: price,
        variants: [{ sku: row.sku, attributes: {}, price, stock }],
        tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
        published: false,
        approvalStatus: "pending",
      });
      result.created += 1;
    } catch (err) {
      result.skipped.push({ row: rowNumber, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return result;
}
