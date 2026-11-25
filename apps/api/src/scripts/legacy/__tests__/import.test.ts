import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

vi.mock("../../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { importLegacyDump } from "../import.js";
import { parseDump, date, jsonArray, num, str } from "../sql-dump.js";
import { User } from "../../../models/User.js";
import { Shop } from "../../../models/Shop.js";
import { Category, Brand } from "../../../models/Category.js";
import { Product, FlashDeal } from "../../../models/Product.js";
import { Order } from "../../../models/Order.js";
import { Cart } from "../../../models/Cart.js";
import { Coupon } from "../../../models/Coupon.js";
import { Currency } from "../../../models/Localization.js";
import { Wallet, WalletTransaction } from "../../../models/Wallet.js";
import { Review } from "../../../models/Address.js";
import { LegacyIdMap } from "../../../models/LegacyMap.js";
import { BusinessSetting } from "../../../models/Settings.js";
import { SellerPackage } from "../../../models/Package.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// The real legacy mysqldump is retained as an importer test fixture so the
// cut-over tooling stays exercised against genuine data after the legacy PHP
// application tree was removed.
const DUMP = path.resolve(here, "fixtures/software_ecommercemvendor22.sql");

let repl: MongoMemoryReplSet;
let sql: string;

beforeAll(async () => {
  sql = await fs.readFile(DUMP, "utf8");
  repl = await MongoMemoryReplSet.create({ binary: { version: "8.0.17" }, replSet: { count: 1 } });
  await mongoose.connect(repl.getUri(), { dbName: "legacy_import" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  await repl?.stop();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
});

describe("legacy mysqldump parser", () => {
  it("reads quoting, escapes, NULLs and numbers out of the real dump", () => {
    const dump = parseDump(sql);

    // Every table in the dump that has rows is readable.
    expect(dump.tables.get("users")!.length).toBeGreaterThan(0);
    const category = dump.tables.get("categories")!.find((row) => String(row.id) === "1")!;
    expect(category.name).toBe("Women's Fashion"); // \' unescaped
    expect(category.commision_rate).toBe(0);

    const order = dump.tables.get("orders")![0]!;
    expect(typeof order.shipping_address).toBe("string");
    expect(JSON.parse(String(order.shipping_address)).postal_code).toBe("380058");
    expect(order.guest_id).toBeNull();

    const shop = dump.tables.get("shops")!.find((row) => String(row.id) === "1")!;
    expect(jsonArray(shop.sliders).length).toBe(3);
  });

  it("decodes the value forms a dump can contain", () => {
    const parsed = parseDump(
      "CREATE TABLE `t` (\n  `id` int(11) NOT NULL,\n  `a` varchar(10),\n  `b` int(11),\n  `c` datetime\n) ENGINE=InnoDB;\n" +
        "INSERT INTO `t` (`id`, `a`, `b`, `c`) VALUES (1, 'it\\'s, \"here\"', -2.5, '2020-11-12 15:54:07'), (2, NULL, 0, '0000-00-00 00:00:00');",
    );
    const rows = parsed.tables.get("t")!;
    expect(rows).toHaveLength(2);
    expect(rows[0]!.a).toBe(`it's, "here"`); // commas and quotes inside a literal
    expect(rows[0]!.b).toBe(-2.5);
    expect(date(rows[0]!.c)!.toISOString()).toBe("2020-11-12T15:54:07.000Z");
    expect(str(rows[1]!.a)).toBeNull();
    expect(num(rows[1]!.b, 7)).toBe(0); // a real 0 is not the fallback
    expect(date(rows[1]!.c)).toBeNull(); // zero dates are not dates
  });

  it("refuses a row whose value count does not match its columns", () => {
    expect(() => parseDump("INSERT INTO `t` (`a`, `b`) VALUES (1);")).toThrow(/2 columns/);
  });
});

describe("legacy data import", () => {
  it("reports what it would write without writing anything in a dry run", async () => {
    const report = await importLegacyDump({ sql, dryRun: true });

    expect(report.dryRun).toBe(true);
    expect(report.tables.find((table) => table.table === "users")!.created).toBeGreaterThan(0);
    expect(await User.countDocuments()).toBe(0);
    expect(await LegacyIdMap.countDocuments()).toBe(0);
  });

  it("imports the catalogue, customers and order history with their relations intact", async () => {
    const report = await importLegacyDump({ sql, uploadsBaseUrl: "/legacy" });
    const dump = parseDump(sql);

    // Users keep their bcrypt hash, so imported accounts can still sign in.
    // passwordHash is select:false, so it has to be asked for explicitly.
    const seller = await User.findOne({ email: "seller@example.com" }).select("+passwordHash");
    expect(seller).toBeTruthy();
    expect(seller!.role).toBe("seller");
    expect(seller!.passwordHash.startsWith("$2y$")).toBe(true);

    // Taxonomy is rebuilt as one tree with ancestors, from three legacy tables.
    const root = await Category.findOne({ slug: "women-fashion" });
    expect(root!.level).toBe(0);
    const child = await Category.findOne({ parentId: root!._id });
    if (child) {
      expect(child.level).toBe(1);
      expect(child.ancestors.map(String)).toContain(String(root!._id));
      const grandchild = await Category.findOne({ parentId: child._id });
      if (grandchild) {
        expect(grandchild.level).toBe(2);
        expect(grandchild.ancestors.map(String)).toEqual([String(root!._id), String(child._id)]);
      }
    }

    // Products carry their variants (legacy product_stocks) and their seller.
    const products = await Product.find();
    expect(products.length).toBe(report.tables.find((t) => t.table === "products")!.created);
    for (const product of products) {
      expect(product.variants.length).toBeGreaterThan(0);
      if (product.addedBy === "seller") expect(product.sellerId).toBeTruthy();
      expect(product.categoryId).toBeTruthy();
      for (const image of product.images) expect(image.startsWith("/legacy") || image.startsWith("http")).toBe(true);
    }
    const variantProduct = await Product.findOne({ "variants.1": { $exists: true } });
    expect(variantProduct).toBeTruthy();

    // Orders become one shipment per seller, holding that seller's lines, with the
    // unit price recovered from the legacy line total.
    const orderRows = dump.tables.get("orders")!;
    const detailRows = dump.tables.get("order_details")!;
    const orders = await Order.find().sort({ createdAt: 1 });
    expect(orders.length).toBeGreaterThan(0);
    for (const order of orders) {
      expect(order.details.length).toBeGreaterThan(0);
      for (const detail of order.details) expect(detail.items.length).toBeGreaterThan(0);
      expect(order.addressSnapshot).toBeTruthy();
      expect(order.grandTotal).toBeGreaterThanOrEqual(0);
    }

    const firstLegacy = orderRows[0]!;
    const firstOrder = await Order.findOne({ code: String(firstLegacy.code) });
    expect(firstOrder).toBeTruthy();
    expect(firstOrder!.grandTotal).toBe(num(firstLegacy.grand_total));
    const firstDetail = detailRows.find((row) => String(row.order_id) === String(firstLegacy.id))!;
    const firstItem = firstOrder!.details[0]!.items[0]!;
    expect(firstItem.quantity).toBe(num(firstDetail.quantity));
    // Legacy stored the line total; the item stores a unit price.
    expect(firstItem.unitPrice).toBe(num(firstDetail.price) / num(firstDetail.quantity));
    expect(firstOrder!.paymentMethod).toBe("cod");

    // Every order item points at an existing product and one of its SKUs.
    for (const order of orders) {
      for (const detail of order.details) {
        for (const item of detail.items) {
          const product = await Product.findById(item.productId);
          expect(product).toBeTruthy();
          expect(product!.variants.some((variant) => variant.sku === item.variantSku)).toBe(true);
        }
      }
    }

    // Carts collapse from one row per line to one document per shopper.
    const cartRows = dump.tables.get("carts")!;
    const carts = await Cart.find();
    expect(carts.length).toBeLessThanOrEqual(new Set(cartRows.map((row) => String(row.user_id))).size);
    for (const cart of carts) {
      expect(cart.userId).toBeTruthy();
      expect(cart.items.length).toBeGreaterThan(0);
    }

    // Rates are re-expressed against the store's own default currency, which in
    // this dump is the (non-ISO) code "Rupee" at a legacy rate of 68.45 to the
    // dollar. The default currency therefore comes out at 1, the dollar at 68.45,
    // and the operator is warned about the code itself rather than it being guessed.
    const base = await Currency.findOne({ code: "Rupee" });
    expect(base).toBeTruthy();
    expect(base!.rateToBase).toBe(1);
    const usd = await Currency.findOne({ code: "USD" });
    expect(usd!.rateToBase).toBe(68.45); // one dollar is worth 68.45 of the base
    expect(report.warnings.some((warning) => warning.includes('Currency "Rupee"'))).toBe(true);
    // Every imported price is denominated in that same currency.
    const priced = await Product.findOne();
    expect(priced!.currency).toBe("Rupee");

    // Settings, packages, coupons, shops and campaigns all land.
    const business = await BusinessSetting.findOne({ key: "business" });
    expect(business!.activation!.vendorSystem).toBe(true);
    expect(await SellerPackage.countDocuments()).toBeGreaterThan(0);
    const coupon = await Coupon.findOne({ code: "V4LOCAL10" });
    expect(coupon!.type).toBe("percent");
    expect(coupon!.minOrderValue).toBe(1000);
    expect(coupon!.maxDiscount).toBe(100);
    expect(await Brand.countDocuments()).toBeGreaterThan(0);

    const shops = await Shop.find();
    expect(shops.length).toBeGreaterThan(0);
    for (const shop of shops) expect(shop.sellerId).toBeTruthy();

    for (const deal of await FlashDeal.find()) {
      expect(deal.products.length).toBeGreaterThan(0);
      expect(deal.endsAt.getTime()).toBeGreaterThan(deal.startsAt.getTime());
      for (const line of deal.products) {
        const product = await Product.findById(line.productId);
        expect(product!.variants.some((variant) => variant.sku === line.variantSku)).toBe(true);
      }
    }

    // A legacy balance becomes a wallet plus one opening statement row.
    const funded = dump.tables.get("users")!.filter((row) => num(row.balance) > 0);
    for (const row of funded) {
      const user = await User.findOne({ email: String(row.email).toLowerCase() });
      const wallet = await Wallet.findOne({ userId: user!._id });
      expect(wallet!.balance).toBe(num(row.balance));
      expect(await WalletTransaction.countDocuments({ userId: user!._id, refType: "manual" })).toBe(1);
    }

    // Ratings are recomputed from the imported reviews rather than copied.
    for (const product of await Product.find({ ratingCount: { $gt: 0 } })) {
      const reviews = await Review.find({ productId: product._id, approved: true });
      expect(product.ratingCount).toBe(reviews.length);
    }

    // Nothing is left unexplained: every dump table is imported, named in
    // notImported, or called out as a warning.
    const claimed = new Set([...report.tables.map((t) => t.table), ...report.notImported.map((t) => t.table)]);
    for (const table of dump.tables.keys()) {
      if (claimed.has(table)) continue;
      expect(report.warnings.some((warning) => warning.includes(`"${table}"`))).toBe(true);
    }
  }, 180_000);

  it("is idempotent: a second run updates the same documents instead of duplicating them", async () => {
    await importLegacyDump({ sql });
    const counts = async () => ({
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      categories: await Category.countDocuments(),
      carts: await Cart.countDocuments(),
      wallets: await WalletTransaction.countDocuments(),
      map: await LegacyIdMap.countDocuments(),
    });
    const first = await counts();
    const firstUser = await User.findOne().sort({ _id: 1 });

    const second = await importLegacyDump({ sql });
    expect(await counts()).toEqual(first);
    // Same document, not a replacement.
    const againUser = await User.findById(firstUser!._id);
    expect(againUser).toBeTruthy();
    // The second run reports updates, not creations.
    expect(second.tables.find((table) => table.table === "users")!.created).toBe(0);
    expect(second.tables.find((table) => table.table === "users")!.updated).toBeGreaterThan(0);
  }, 240_000);

  it("imports a single table on request without touching the others", async () => {
    await importLegacyDump({ sql, only: ["categories", "brands"] });
    expect(await Category.countDocuments()).toBeGreaterThan(0);
    expect(await Brand.countDocuments()).toBeGreaterThan(0);
    expect(await User.countDocuments()).toBe(0);
    expect(await Product.countDocuments()).toBe(0);
  }, 120_000);
});
