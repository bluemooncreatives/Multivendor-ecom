import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../../config/env.js", () => ({ env: {} }));
vi.mock("../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { generateSkuCombinationsHandler } = await import("../product.controller.js");

/** Minimal Response stand-in that captures whatever the handler sends. */
function mockResponse() {
  const captured: { body?: unknown } = {};
  return {
    res: { json: (body: unknown) => (captured.body = body) } as unknown as Response,
    captured,
  };
}

async function generate(body: Record<string, unknown>) {
  const { res, captured } = mockResponse();
  await generateSkuCombinationsHandler({ body } as Request, res);
  return (captured.body as { variants: { sku: string; attributes: Record<string, string> }[] }).variants;
}

describe("generateSkuCombinationsHandler", () => {
  it("expands one attribute into one variant per value", async () => {
    const variants = await generate({ baseSku: "shirt", basePrice: 500, attributes: { Size: ["S", "M", "L"] } });
    expect(variants).toHaveLength(3);
    expect(variants.map((v) => v.attributes.Size)).toEqual(["S", "M", "L"]);
  });

  it("produces the full cartesian product across attributes", async () => {
    const variants = await generate({
      baseSku: "shirt",
      basePrice: 500,
      attributes: { Colour: ["Red", "Blue"], Size: ["S", "M"] },
    });

    expect(variants).toHaveLength(4);
    expect(new Set(variants.map((v) => v.sku)).size).toBe(4); // every SKU distinct
  });

  it("builds an uppercase, space-free SKU from the base and the chosen values", async () => {
    const variants = await generate({ baseSku: "tee", basePrice: 100, attributes: { Colour: ["Dark Green"] } });
    expect(variants[0]!.sku).toBe("TEE-DARKGREEN");
  });

  it("seeds every variant with the base price and zero stock", async () => {
    const variants = await generate({ baseSku: "x", basePrice: 250, attributes: { Size: ["S", "M"] } });
    for (const variant of variants) {
      expect(variant).toMatchObject({ price: 250, stock: 0 });
    }
  });

  // Guards against a client asking for an expansion that would take the product
  // document past a workable size.
  it("refuses an expansion beyond 200 variants", async () => {
    const many = Array.from({ length: 15 }, (_, i) => `v${i}`);
    await expect(
      generate({ baseSku: "x", basePrice: 1, attributes: { A: many, B: many } }),
    ).rejects.toThrow(/limit is 200/);
  });

  it("allows an expansion exactly at the limit", async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => `a${i}`);
    const ten = Array.from({ length: 10 }, (_, i) => `b${i}`);
    const variants = await generate({ baseSku: "x", basePrice: 1, attributes: { A: twenty, B: ten } });
    expect(variants).toHaveLength(200);
  });

  it("returns a single attribute-less variant when nothing is selected", async () => {
    const variants = await generate({ baseSku: "plain", basePrice: 99, attributes: {} });
    expect(variants).toEqual([{ sku: "PLAIN", attributes: {}, price: 99, stock: 0 }]);
  });
});
