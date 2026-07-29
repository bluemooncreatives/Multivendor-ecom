import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/env.js", () => ({ env: {} }));
vi.mock("../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const couponFindOne = vi.fn();
const usageCount = vi.fn();

vi.mock("../../models/Coupon.js", () => ({
  Coupon: { findOne: (...args: unknown[]) => couponFindOne(...args) },
  CouponUsage: {
    countDocuments: (...args: unknown[]) => usageCount(...args),
    create: vi.fn(),
  },
}));

const { validateCoupon } = await import("../coupon.service.js");

const owner = { userId: "u1" };

/** A coupon with sensible defaults, overridable per test. */
function coupon(overrides: Record<string, unknown> = {}) {
  return {
    _id: "c1",
    code: "SAVE",
    type: "percent",
    value: 10,
    scope: "cart",
    productIds: [],
    categoryIds: [],
    minOrderValue: 0,
    maxDiscount: null,
    usageLimitPerUser: 1,
    usageLimitTotal: null,
    startsAt: null,
    expiresAt: null,
    active: true,
    ...overrides,
  };
}

beforeEach(() => {
  couponFindOne.mockReset();
  usageCount.mockReset().mockResolvedValue(0);
});

describe("validateCoupon", () => {
  it("rejects an unknown code", async () => {
    couponFindOne.mockResolvedValue(null);
    await expect(validateCoupon("NOPE", 100, owner)).rejects.toThrow(/Invalid coupon/);
  });

  it("rejects a coupon that has not started", async () => {
    couponFindOne.mockResolvedValue(coupon({ startsAt: new Date(Date.now() + 86_400_000) }));
    await expect(validateCoupon("SAVE", 100, owner)).rejects.toThrow(/not active yet/);
  });

  it("rejects an expired coupon", async () => {
    couponFindOne.mockResolvedValue(coupon({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(validateCoupon("SAVE", 100, owner)).rejects.toThrow(/expired/);
  });

  it("enforces the minimum order value", async () => {
    couponFindOne.mockResolvedValue(coupon({ minOrderValue: 500 }));
    await expect(validateCoupon("SAVE", 100, owner)).rejects.toThrow(/minimum order/);
  });

  it("enforces the per-user limit", async () => {
    couponFindOne.mockResolvedValue(coupon());
    usageCount.mockResolvedValue(1);
    await expect(validateCoupon("SAVE", 100, owner)).rejects.toThrow(/already used/);
  });

  describe("cart-scoped", () => {
    it("takes a percentage of the whole order", async () => {
      couponFindOne.mockResolvedValue(coupon({ type: "percent", value: 20 }));
      const { discount } = await validateCoupon("SAVE", 250, owner);
      expect(discount).toBe(50);
    });

    it("caps a percentage discount at maxDiscount", async () => {
      couponFindOne.mockResolvedValue(coupon({ type: "percent", value: 50, maxDiscount: 100 }));
      const { discount } = await validateCoupon("SAVE", 1000, owner);
      expect(discount).toBe(100);
    });

    it("never discounts more than the order is worth", async () => {
      couponFindOne.mockResolvedValue(coupon({ type: "flat", value: 500 }));
      const { discount } = await validateCoupon("SAVE", 200, owner);
      expect(discount).toBe(200);
    });
  });

  describe("product-scoped", () => {
    const lines = [
      { productId: "p1", categoryId: "cat1", categoryPath: ["root"], lineSubtotal: 100 },
      { productId: "p2", categoryId: "cat2", categoryPath: [], lineSubtotal: 300 },
    ];

    it("needs the cart contents to evaluate", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", productIds: ["p1"] }));
      await expect(validateCoupon("SAVE", 400, owner)).rejects.toThrow(/needs your cart/);
    });

    // The bug this guards: passing only a flat subtotal discounted the whole
    // order, so a coupon meant for one product cut the price of everything.
    it("discounts only the qualifying line, not the whole order", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", value: 10, productIds: ["p1"] }));
      const { discount } = await validateCoupon("SAVE", 400, owner, lines);
      expect(discount).toBe(10); // 10% of 100, not of 400
    });

    it("matches by the line's own category", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", value: 10, categoryIds: ["cat2"] }));
      const { discount } = await validateCoupon("SAVE", 400, owner, lines);
      expect(discount).toBe(30);
    });

    it("matches a coupon scoped to an ancestor category", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", value: 10, categoryIds: ["root"] }));
      const { discount } = await validateCoupon("SAVE", 400, owner, lines);
      expect(discount).toBe(10); // only p1 sits under "root"
    });

    it("rejects a coupon that matches nothing in the cart", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", productIds: ["p9"] }));
      await expect(validateCoupon("SAVE", 400, owner, lines)).rejects.toThrow(/does not apply/);
    });

    it("sums every qualifying line", async () => {
      couponFindOne.mockResolvedValue(coupon({ scope: "product", value: 10, productIds: ["p1", "p2"] }));
      const { discount } = await validateCoupon("SAVE", 400, owner, lines);
      expect(discount).toBe(40);
    });
  });
});
