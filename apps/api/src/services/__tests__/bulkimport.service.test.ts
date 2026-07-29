import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/env.js", () => ({ env: {} }));
vi.mock("../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

// A three-level tree: root > sub > subsub, plus an unrelated root.
const CATEGORIES = [
  { _id: "root", slug: "electronics", ancestors: [] },
  { _id: "sub", slug: "phones", ancestors: ["root"] },
  { _id: "subsub", slug: "android", ancestors: ["root", "sub"] },
  { _id: "other", slug: "garden", ancestors: [] },
];

const created: Record<string, unknown>[] = [];

vi.mock("../../models/Category.js", () => ({
  Category: { find: () => ({ lean: async () => CATEGORIES }) },
  Brand: { find: () => ({ lean: async () => [{ _id: "brand1", slug: "acme" }] }) },
}));

vi.mock("../../models/Product.js", () => ({
  Product: {
    create: async (doc: Record<string, unknown>) => {
      created.push(doc);
      return doc;
    },
  },
}));

const { importProductsCsv } = await import("../bulkimport.service.js");

const HEADER =
  "name,slug,categorySlug,subCategorySlug,subSubCategorySlug,brandSlug,description,basePrice,purchasePrice,stock,sku,unit,barcode,discount,discountType,tax,taxType,shippingType,shippingCost,minOrderQty,videoProvider,videoLink,metaTitle,metaDescription,tags";

function csv(...rows: string[]) {
  return Buffer.from([HEADER, ...rows].join("\n"), "utf8");
}

beforeEach(() => {
  created.length = 0;
});

describe("importProductsCsv", () => {
  it("imports a row using only the required columns", async () => {
    const result = await importProductsCsv("seller1", csv("Phone,phone,electronics,,,,,999,,5,SKU1,,,,,,,,,,,,,,"));

    expect(result.created).toBe(1);
    expect(result.skipped).toHaveLength(0);
    expect(created[0]).toMatchObject({ name: "Phone", slug: "phone", basePrice: 999, sellerId: "seller1" });
  });

  it("files the product under the deepest category named", async () => {
    await importProductsCsv("seller1", csv("Phone,phone,electronics,phones,android,,,999,,5,SKU1,,,,,,,,,,,,,,"));

    expect(created[0]).toMatchObject({ categoryId: "subsub", subCategoryId: "sub", subSubCategoryId: "subsub" });
  });

  // A row naming categories from unrelated branches is a data error, not
  // something to silently file under whichever one happened to be deepest.
  it("skips a row whose category columns are in different branches", async () => {
    const result = await importProductsCsv("seller1", csv("Phone,phone,garden,phones,,,,999,,5,SKU1,,,,,,,,,,,,,,"));

    expect(result.created).toBe(0);
    expect(result.skipped[0]!.reason).toMatch(/same branch/);
  });

  it("skips a row with an unknown category slug", async () => {
    const result = await importProductsCsv("seller1", csv("Phone,phone,nosuch,,,,,999,,5,SKU1,,,,,,,,,,,,,,"));
    expect(result.skipped[0]!.reason).toMatch(/unknown categorySlug/i);
  });

  it("skips a row with an unknown brand slug rather than importing it brandless", async () => {
    const result = await importProductsCsv("seller1", csv("Phone,phone,electronics,,,nosuch,,999,,5,SKU1,,,,,,,,,,,,,,"));
    expect(result.skipped[0]!.reason).toMatch(/Unknown brandSlug/);
  });

  it("resolves a known brand slug to its id", async () => {
    await importProductsCsv("seller1", csv("Phone,phone,electronics,,,acme,,999,,5,SKU1,,,,,,,,,,,,,,"));
    expect(created[0]!.brandId).toBe("brand1");
  });

  it("reports the offending row number, counting the header", async () => {
    const result = await importProductsCsv(
      "seller1",
      csv("Good,good,electronics,,,,,10,,1,S1,,,,,,,,,,,,,,", "Bad,bad,nosuch,,,,,10,,1,S2,,,,,,,,,,,,,,"),
    );

    expect(result.created).toBe(1);
    expect(result.skipped[0]!.row).toBe(3);
  });

  it("skips a row with a non-numeric price", async () => {
    const result = await importProductsCsv("seller1", csv("Phone,phone,electronics,,,,,abc,,5,SKU1,,,,,,,,,,,,,,"));
    expect(result.skipped[0]!.reason).toMatch(/must be numbers/);
  });

  it("parses the optional pricing and shipping columns", async () => {
    await importProductsCsv(
      "seller1",
      csv("Phone,phone,electronics,,,,,999,600,5,SKU1,kg,BAR1,15,flat,8,percent,flat_rate,40,2,,,,,"),
    );

    expect(created[0]).toMatchObject({
      purchasePrice: 600,
      unit: "kg",
      barcode: "BAR1",
      discount: 15,
      discountType: "flat",
      tax: 8,
      shippingType: "flat_rate",
      shippingCost: 40,
      minOrderQty: 2,
    });
  });

  // Blank is not zero: an empty tax column must fall back to the store rate,
  // which a stored 0 would override.
  it("leaves an omitted tax null rather than defaulting it to zero", async () => {
    await importProductsCsv("seller1", csv("Phone,phone,electronics,,,,,999,,5,SKU1,,,,,,,,,,,,,,"));
    expect(created[0]!.tax).toBeNull();
  });

  it("does not tag a product as having a video when only the provider column is set", async () => {
    await importProductsCsv("seller1", csv("Phone,phone,electronics,,,,,999,,5,SKU1,,,,,,,,,,youtube,,,,"));
    expect(created[0]!.videoProvider).toBeNull();
  });

  it("splits tags on commas inside the cell", async () => {
    await importProductsCsv("seller1", csv('Phone,phone,electronics,,,,,999,,5,SKU1,,,,,,,,,,,,,,"new, sale, top"'));
    expect(created[0]!.tags).toEqual(["new", "sale", "top"]);
  });

  it("queues seller imports for review but publishes admin imports", async () => {
    await importProductsCsv("seller1", csv("A,a,electronics,,,,,10,,1,S1,,,,,,,,,,,,,,"));
    expect(created[0]).toMatchObject({ published: false, approvalStatus: "pending" });

    created.length = 0;
    await importProductsCsv(null, csv("B,b,electronics,,,,,10,,1,S2,,,,,,,,,,,,,,"), { addedBy: "admin" });
    expect(created[0]).toMatchObject({ published: true, approvalStatus: "approved", addedBy: "admin" });
  });

  it("keeps importing after a bad row instead of failing the whole batch", async () => {
    const result = await importProductsCsv(
      "seller1",
      csv(
        "A,a,electronics,,,,,10,,1,S1,,,,,,,,,,,,,,",
        "Bad,bad,nosuch,,,,,10,,1,S2,,,,,,,,,,,,,,",
        "C,c,electronics,,,,,10,,1,S3,,,,,,,,,,,,,,",
      ),
    );

    expect(result.created).toBe(2);
    expect(result.skipped).toHaveLength(1);
  });
});
