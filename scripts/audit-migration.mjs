import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const root = fileURLToPath(new URL("../", import.meta.url));
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");
const legacyExport = JSON.parse(fs.readFileSync(path.join(root, "data", "mongodb", "legacy-export.json"), "utf8"));
const legacyProducts = legacyExport.tables?.products || [];
const legacyProductStocks = legacyExport.tables?.product_stocks || [];
const legacyProductIds = new Set(legacyProducts.map((product) => String(product.id)));
const embeddableLegacyStocks = legacyProductStocks.filter((stock) => legacyProductIds.has(String(stock.product_id)));
const orphanLegacyStocks = legacyProductStocks.filter((stock) => !legacyProductIds.has(String(stock.product_id)));

const expectedCounts = {
  users: 48, categories: 56, brands: 14, shops: 17, products: 154, orders: 14, addresses: 4,
  wishlists: 6, carts: 7, coupons: 1, settings: 72, sliders: 7, tickets: 2, conversations: 2,
  affiliateusers: 1, homecategories: 5, currencies: 25, languages: 3, countries: 296, addons: 4,
  seosettings: 1, affiliateconfigs: 1, affiliateoptions: 3, affiliatepayments: 1, appsettings: 1,
  attributes: 3, banners: 7, colors: 143, customers: 29, links: 3, productstocks: 239,
  roles: 2, searches: 21, sellers: 21, sellerpackages: 1, staff: 1, subscribers: 3,
};
const assetExtension = /\.(?:avif|gif|ico|jpe?g|pdf|png|svg|webp|xlsx|zip)(?:[?#].*)?$/i;
const embeddedAsset = /(?:^|["'(\s])((?:uploads|shop|frontend\/images|download)\/[A-Za-z0-9_./%+() -]+\.(?:avif|gif|ico|jpe?g|pdf|png|svg|webp|xlsx|zip))/gi;

function normalizeAsset(value) {
  return value.trim().replaceAll("\\", "/").replace(/^https?:\/\/[^/]+\//i, "").replace(/^\/+/, "").replace(/^public\//i, "").split(/[?#]/, 1)[0];
}

function collectAssets(value, assets) {
  if (typeof value === "string") {
    const clean = value.trim();
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean) && assetExtension.test(clean) && !clean.includes("<")) assets.add(normalizeAsset(clean));
    for (const match of clean.matchAll(embeddedAsset)) assets.add(normalizeAsset(match[1]));
    if ((clean.startsWith("[") && clean.endsWith("]")) || (clean.startsWith("{") && clean.endsWith("}"))) {
      try { collectAssets(JSON.parse(clean), assets); } catch {}
    }
    return;
  }
  if (Array.isArray(value)) { value.forEach((item) => collectAssets(item, assets)); return; }
  if (value && typeof value === "object") {
    const record = value;
    for (const [key, item] of Object.entries(record)) {
      if (key === "name" && typeof record.path === "string") continue;
      collectAssets(item, assets);
    }
  }
}

async function orphanCount(db, collection, localField, targetCollection) {
  const [result] = await db.collection(collection).aggregate([
    { $match: { [localField]: { $ne: null } } },
    { $lookup: { from: targetCollection, localField, foreignField: "_id", as: "target" } },
    { $match: { target: { $size: 0 } } },
    { $count: "count" },
  ]).toArray();
  return result?.count || 0;
}

async function orphanArrayCount(db, collection, arrayField, localField, targetCollection) {
  const [result] = await db.collection(collection).aggregate([{ $unwind: `$${arrayField}` }, { $match: { [localField]: { $ne: null } } }, { $lookup: { from: targetCollection, localField, foreignField: "_id", as: "target" } }, { $match: { target: { $size: 0 } } }, { $count: "count" }]).toArray();
  return result?.count || 0;
}

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined, serverSelectionTimeoutMS: 10_000 });
try {
  const db = mongoose.connection.db;
  const countEntries = await Promise.all(Object.entries(expectedCounts).map(async ([collection, expected]) => {
    const actual = await db.collection(collection).countDocuments();
    return [collection, { expected, actual, matches: expected === actual }];
  }));
  const counts = Object.fromEntries(countEntries);
  const countMismatches = Object.entries(counts).filter(([, value]) => !value.matches);

  const relations = {
    productSellers: await orphanCount(db, "products", "seller", "users"),
    productCategories: await orphanCount(db, "products", "category", "categories"),
    productSubcategories: await orphanCount(db, "products", "subcategory", "categories"),
    productSubsubcategories: await orphanCount(db, "products", "subsubcategory", "categories"),
    shopOwners: await orphanCount(db, "shops", "owner", "users"),
    categoryParents: await orphanCount(db, "categories", "parent", "categories"),
    addressUsers: await orphanCount(db, "addresses", "user", "users"),
    wishlistUsers: await orphanCount(db, "wishlists", "user", "users"),
    wishlistProducts: await orphanCount(db, "wishlists", "product", "products"),
    cartUsers: await orphanCount(db, "carts", "user", "users"),
    cartProducts: await orphanArrayCount(db, "carts", "items", "items.product", "products"),
    orderProducts: await orphanArrayCount(db, "orders", "items", "items.product", "products"),
    orderSellers: await orphanArrayCount(db, "orders", "items", "items.seller", "users"),
    ticketUsers: await orphanCount(db, "tickets", "user", "users"),
    affiliateUsers: await orphanCount(db, "affiliateusers", "user", "users"),
    homeCategories: await orphanCount(db, "homecategories", "category", "categories"),
  };
  const relationFailures = Object.entries(relations).filter(([, count]) => count > 0);
  const [variantSummary] = await db.collection("products").aggregate([{ $project: { variants: { $size: { $cond: [{ $isArray: "$variants" }, "$variants", []] } } } }, { $group: { _id: null, variants: { $sum: "$variants" } } }]).toArray();
  const embeddedVariants = variantSummary?.variants || 0;

  const passwordSummary = await db.collection("users").aggregate([
    { $group: { _id: null, users: { $sum: 1 }, withPassword: { $sum: { $cond: [{ $regexMatch: { input: { $ifNull: ["$passwordHash", ""] }, regex: /^\$2[aby]\$\d{2}\$/ } }, 1, 0] } }, withoutPassword: { $sum: { $cond: [{ $eq: [{ $ifNull: ["$passwordHash", ""] }, ""] }, 1, 0] } } } },
  ]).toArray();

  const translationSummary = Object.fromEntries((await db.collection("languages").find({}).project({ code: 1, translations: 1 }).toArray()).map((language) => [language.code, Object.keys(language.translations || {}).length]));
  const expectedTranslations = Object.fromEntries((legacyExport.tables?.languages || []).map((language) => {
    const code = String(language.code || "").trim();
    const file = path.join(root, "data", "i18n", `${code}.json`);
    return [code, fs.existsSync(file) ? Object.keys(JSON.parse(fs.readFileSync(file, "utf8"))).length : 0];
  }));
  const translationsMatch = Object.entries(expectedTranslations).every(([code, count]) => translationSummary[code] === count);

  const assets = new Set();
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of collections) {
    const documents = await db.collection(name).find({}).toArray();
    collectAssets(documents, assets);
  }
  const missingAssets = [];
  const unsafeAssets = [];
  for (const asset of [...assets].sort()) {
    const absolute = path.resolve(root, "public", asset);
    const publicRoot = path.resolve(root, "public") + path.sep;
    if (!absolute.startsWith(publicRoot)) { unsafeAssets.push(asset); continue; }
    if (!fs.existsSync(absolute)) missingAssets.push(asset);
  }

  const hello = await db.admin().command({ hello: 1 });
  const transactionsSupported = Boolean(hello.setName || hello.msg === "isdbgrid");
  const activeSettings = Object.fromEntries((await db.collection("settings").find({ key: { $in: [
    "business.cash_payment", "business.coupon_system", "business.conversation_system", "business.email_verification",
    "business.facebook_login", "business.google_login", "business.google_analytics", "business.facebook_chat",
    "business.facebook_pixel", "business.guest_checkout_active", "business.vendor_system_activation",
  ] } }).toArray()).map((setting) => [setting.key, setting.value]));

  const report = {
    database: db.databaseName,
    countMismatches: Object.fromEntries(countMismatches),
    counts,
    relations,
    embeddedVariants: { expected: embeddableLegacyStocks.length, actual: embeddedVariants, matches: embeddedVariants === embeddableLegacyStocks.length },
    legacyStockOrphans: {
      count: orphanLegacyStocks.length,
      productIds: [...new Set(orphanLegacyStocks.map((stock) => stock.product_id))],
      preservedInRawCollection: counts.productstocks.matches,
    },
    passwordSummary: passwordSummary[0] || { users: 0, withPassword: 0, withoutPassword: 0 },
    translations: { expected: expectedTranslations, actual: translationSummary, matches: translationsMatch },
    assets: { referenced: assets.size, missing: missingAssets, unsafe: unsafeAssets },
    transactionsSupported,
    activeSettings,
  };
  console.log(JSON.stringify(report, null, 2));
  if (countMismatches.length || relationFailures.length || embeddedVariants !== embeddableLegacyStocks.length || !translationsMatch || missingAssets.length || unsafeAssets.length) process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
