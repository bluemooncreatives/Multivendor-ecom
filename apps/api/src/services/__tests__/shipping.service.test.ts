import { describe, it, expect, vi, beforeEach } from "vitest";

// The seller_wise mode reads each vendor's shop, which is the only database
// access in this module — stubbed so the arithmetic can be tested in isolation.
const shopFind = vi.fn();
vi.mock("../../models/Shop.js", () => ({
  Shop: {
    find: (...args: unknown[]) => {
      shopFind(...args);
      return { session: () => ({ lean: async () => shopFind.mock.results.at(-1)?.value ?? [] }) };
    },
  },
}));

const { calculateShipping, priceLine, ADMIN_BUCKET } = await import("../shipping.service.js");

const flat = {
  mode: "flat" as const,
  flatShippingCost: 60,
  adminShippingCost: 25,
  minOrderForFreeShipping: null,
};

const line = (sellerId: string | null, overrides: Partial<{ quantity: number; shippingType: "free" | "flat_rate"; shippingCost: number }> = {}) => ({
  sellerId,
  quantity: overrides.quantity ?? 1,
  shippingType: overrides.shippingType ?? ("flat_rate" as const),
  shippingCost: overrides.shippingCost ?? 0,
});

beforeEach(() => {
  shopFind.mockReset();
  shopFind.mockReturnValue([]);
});

describe("calculateShipping", () => {
  it("charges nothing in free mode", async () => {
    const costs = await calculateShipping([line("s1"), line("s2")], { ...flat, mode: "free" });
    expect([...costs.values()]).toEqual([0, 0]);
  });

  it("waives shipping once the free-delivery threshold is met", async () => {
    const costs = await calculateShipping([line("s1")], { ...flat, minOrderForFreeShipping: 500 }, new Set(), 500);
    expect(costs.get("s1")).toBe(0);
  });

  it("still charges just below the threshold", async () => {
    const costs = await calculateShipping([line("s1")], { ...flat, minOrderForFreeShipping: 500 }, new Set(), 499.99);
    expect(costs.get("s1")).toBe(60);
  });

  it("splits the flat rate across the shipments, summing to the flat cost", async () => {
    const costs = await calculateShipping([line("s1"), line("s2"), line("s3")], flat);
    expect(costs.get("s1")).toBe(20);
    expect([...costs.values()].reduce((a, b) => a + b, 0)).toBe(60);
  });

  // The legacy version divided by the whole cart, so collecting one shipment in
  // person silently left the others paying for it.
  it("excludes pickup shipments from the flat split rather than making others absorb it", async () => {
    const costs = await calculateShipping([line("s1"), line("s2")], flat, new Set(["s2"]));
    expect(costs.get("s2")).toBe(0);
    expect(costs.get("s1")).toBe(60);
  });

  it("charges nothing at all when every shipment is collected in person", async () => {
    const costs = await calculateShipping([line("s1"), line("s2")], flat, new Set(["s1", "s2"]));
    expect([...costs.values()]).toEqual([0, 0]);
  });

  describe("product_wise", () => {
    const productWise = { ...flat, mode: "product_wise" as const };

    it("charges each line's own cost multiplied by quantity", async () => {
      const costs = await calculateShipping(
        [line("s1", { shippingCost: 30, quantity: 2 }), line("s1", { shippingCost: 10, quantity: 1 })],
        productWise,
      );
      expect(costs.get("s1")).toBe(70);
    });

    it("skips lines marked as free shipping", async () => {
      const costs = await calculateShipping(
        [line("s1", { shippingCost: 30, shippingType: "free" }), line("s1", { shippingCost: 10 })],
        productWise,
      );
      expect(costs.get("s1")).toBe(10);
    });
  });

  describe("seller_wise", () => {
    const sellerWise = { ...flat, mode: "seller_wise" as const };

    it("charges each seller's shop cost once, however many lines they have", async () => {
      shopFind.mockReturnValue([{ sellerId: "s1", shippingCost: 45 }]);
      const costs = await calculateShipping([line("s1"), line("s1"), line("s1")], sellerWise);
      expect(costs.get("s1")).toBe(45);
    });

    it("uses the store's admin cost for In-House items, which have no shop", async () => {
      const costs = await calculateShipping([line(null)], sellerWise);
      expect(costs.get(ADMIN_BUCKET)).toBe(25);
    });

    it("charges nothing for a seller with no shipping cost configured", async () => {
      shopFind.mockReturnValue([]);
      const costs = await calculateShipping([line("s1")], sellerWise);
      expect(costs.get("s1")).toBe(0);
    });
  });
});

describe("priceLine", () => {
  const base = { unitPrice: 100, quantity: 2, storeTaxPercent: 10 };

  it("applies a percentage discount per unit before multiplying out", () => {
    const result = priceLine({ ...base, discount: 25, discountType: "percent", tax: null, taxType: "percent" });
    expect(result.unitPrice).toBe(75);
    expect(result.lineSubtotal).toBe(150);
  });

  it("applies a flat discount per unit, not once per line", () => {
    const result = priceLine({ ...base, discount: 10, discountType: "flat", tax: null, taxType: "percent" });
    expect(result.unitPrice).toBe(90);
    expect(result.lineSubtotal).toBe(180);
  });

  it("never lets a misconfigured discount drive the price negative", () => {
    const result = priceLine({ ...base, discount: 250, discountType: "flat", tax: null, taxType: "percent" });
    expect(result.unitPrice).toBe(0);
    expect(result.lineSubtotal).toBe(0);
  });

  it("falls back to the store tax rate when the product sets none", () => {
    const result = priceLine({ ...base, discount: 0, discountType: "percent", tax: null, taxType: "percent" });
    expect(result.lineTax).toBe(20); // 10% of 200
  });

  it("prefers the product's own percentage rate over the store rate", () => {
    const result = priceLine({ ...base, discount: 0, discountType: "percent", tax: 5, taxType: "percent" });
    expect(result.lineTax).toBe(10);
  });

  it("charges a flat product tax per unit", () => {
    const result = priceLine({ ...base, discount: 0, discountType: "percent", tax: 7, taxType: "flat" });
    expect(result.lineTax).toBe(14);
  });

  it("taxes the discounted price, not the list price", () => {
    const result = priceLine({ ...base, discount: 50, discountType: "percent", tax: null, taxType: "percent" });
    expect(result.lineSubtotal).toBe(100);
    expect(result.lineTax).toBe(10);
  });

  it("treats a zero product tax as zero rather than falling back to the store rate", () => {
    const result = priceLine({ ...base, discount: 0, discountType: "percent", tax: 0, taxType: "percent" });
    expect(result.lineTax).toBe(0);
  });
});
