import crypto from "node:crypto";
import fs from "node:fs";
import mongoose from "mongoose";

const input = process.argv.find((argument) => argument.endsWith(".json")) || "data/mongodb/legacy-export.json";
const replace = process.argv.includes("--replace");
const dryRun = process.argv.includes("--dry-run");
const uri = process.env.MONGODB_URI;
if (!uri && !dryRun) throw new Error("MONGODB_URI is required");
if (!fs.existsSync(input)) throw new Error(`Mongo import data not found: ${input}`);

const exported = JSON.parse(fs.readFileSync(input, "utf8"));
if (exported.format !== "v4local-legacy-mongo-import") throw new Error("Unsupported import format");

// The historical SQL dump indents values after commas. Its quote-aware export
// intentionally preserves source tokens, so normalize string boundaries once
// before any validation, identifier mapping, or document construction.
function normalize(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  return value;
}

const tables = normalize(exported.tables);
const translationRoot = new URL("../data/i18n/", import.meta.url);
const translationsByCode = new Map((tables.languages || []).map((language) => {
  const code = String(language.code || "").trim();
  const file = new URL(`${code}.json`, translationRoot);
  return [code, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}];
}));

function id(table, legacyId) {
  if (legacyId === null || legacyId === undefined || legacyId === "") return null;
  return new mongoose.Types.ObjectId(crypto.createHash("sha256").update(`${table}:${legacyId}`).digest("hex").slice(0, 24));
}
function bool(value) { return value === true || value === 1 || value === "1"; }
function number(value, fallback = 0) { const result = Number(value); return Number.isFinite(result) ? result : fallback; }
function date(value) { const parsed = value ? new Date(value) : null; return parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined; }
function json(value, fallback) { if (typeof value !== "string" || !value.trim()) return fallback; try { return JSON.parse(value); } catch { return fallback; } }
function slug(value, fallback = "item") { return String(value || fallback).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150) || fallback; }
function camel(value) { return value.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase()); }
function generic(row, table) { const document = { _id: id(table, row.id), legacyId: row.id }; for (const [key, value] of Object.entries(row)) if (key !== "id") document[camel(key)] = value; return document; }

async function validateDatabase(db) {
  const duplicateCount = async (collection, field) => {
    const [result] = await db.collection(collection).aggregate([
      { $match: { [field]: { $type: "string", $ne: "" } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "count" },
    ]).toArray();
    return result?.count || 0;
  };
  const orphanCount = async (collection, localField, targetCollection) => {
    const [result] = await db.collection(collection).aggregate([
      { $match: { [localField]: { $ne: null } } },
      { $lookup: { from: targetCollection, localField, foreignField: "_id", as: "target" } },
      { $match: { target: { $size: 0 } } },
      { $count: "count" },
    ]).toArray();
    return result?.count || 0;
  };
  const orphanArrayCount = async (collection, arrayField, localField, targetCollection) => {
    const [result] = await db.collection(collection).aggregate([
      { $unwind: `$${arrayField}` },
      { $match: { [localField]: { $ne: null } } },
      { $lookup: { from: targetCollection, localField, foreignField: "_id", as: "target" } },
      { $match: { target: { $size: 0 } } },
      { $count: "count" },
    ]).toArray();
    return result?.count || 0;
  };
  const [
    duplicateEmails, duplicateCategorySlugs, duplicateBrandSlugs, duplicateShopSlugs, duplicateProductSlugs,
    orphanProductSellers, orphanProductCategories, orphanProductSubcategories, orphanProductSubsubcategories, orphanShopOwners, orphanCategoryParents, orphanOrderProducts,
    orphanOrderSellers, orphanAddressUsers, orphanWishlistUsers, orphanWishlistProducts, orphanCartUsers, orphanCartProducts,
    orphanTicketUsers, orphanConversationParticipants, orphanAffiliateUsers, orphanHomeCategories,
    invalidRoles, boundaryWhitespace, roleCounts,
  ] = await Promise.all([
    duplicateCount("users", "email"), duplicateCount("categories", "slug"), duplicateCount("brands", "slug"),
    duplicateCount("shops", "slug"), duplicateCount("products", "slug"),
    orphanCount("products", "seller", "users"), orphanCount("products", "category", "categories"),
    orphanCount("products", "subcategory", "categories"), orphanCount("products", "subsubcategory", "categories"),
    orphanCount("shops", "owner", "users"), orphanCount("categories", "parent", "categories"),
    db.collection("orders").aggregate([
      { $unwind: "$items" },
      { $match: { "items.product": { $ne: null } } },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
      { $match: { product: { $size: 0 } } },
      { $count: "count" },
    ]).toArray().then(([result]) => result?.count || 0),
    orphanArrayCount("orders", "items", "items.seller", "users"), orphanCount("addresses", "user", "users"),
    orphanCount("wishlists", "user", "users"), orphanCount("wishlists", "product", "products"), orphanCount("carts", "user", "users"),
    orphanArrayCount("carts", "items", "items.product", "products"), orphanCount("tickets", "user", "users"),
    orphanArrayCount("conversations", "participants", "participants", "users"), orphanCount("affiliateusers", "user", "users"), orphanCount("homecategories", "category", "categories"),
    db.collection("users").countDocuments({ role: { $nin: ["customer", "seller", "admin", "staff"] } }),
    db.collection("users").countDocuments({ $or: [{ email: /^\s|\s$/ }, { name: /^\s|\s$/ }, { role: /^\s|\s$/ }] }),
    db.collection("users").aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
  ]);
  const checks = { duplicateEmails, duplicateCategorySlugs, duplicateBrandSlugs, duplicateShopSlugs, duplicateProductSlugs, orphanProductSellers, orphanProductCategories, orphanProductSubcategories, orphanProductSubsubcategories, orphanShopOwners, orphanCategoryParents, orphanOrderProducts, orphanOrderSellers, orphanAddressUsers, orphanWishlistUsers, orphanWishlistProducts, orphanCartUsers, orphanCartProducts, orphanTicketUsers, orphanConversationParticipants, orphanAffiliateUsers, orphanHomeCategories, invalidRoles, boundaryWhitespace };
  const failures = Object.entries(checks).filter(([, count]) => count > 0);
  console.log("MongoDB integrity:", JSON.stringify({ ...checks, roleCounts: Object.fromEntries(roleCounts.map(({ _id, count }) => [_id, count])) }));
  if (failures.length) throw new Error(`MongoDB integrity validation failed: ${failures.map(([name, count]) => `${name}=${count}`).join(", ")}`);
}

function timestamps(row) { return { createdAt: date(row.created_at) || new Date(), updatedAt: date(row.updated_at) || date(row.created_at) || new Date() }; }

const users = (tables.users || []).map((row) => ({
  _id: id("users", row.id), legacyId: row.id, name: row.name || row.email || "Imported user",
  email: String(row.email || `legacy-${row.id}@invalid.local`).toLowerCase(), passwordHash: row.password || undefined,
  role: ["admin", "seller", "staff"].includes(row.user_type) ? row.user_type : "customer",
  status: bool(row.banned) ? "banned" : "active", emailVerifiedAt: date(row.email_verified_at), avatar: row.avatar,
  phone: row.phone, provider: "imported", providerId: row.provider_id || undefined, balance: Math.max(0, number(row.balance)), ...timestamps(row),
}));

const categories = [
  ...(tables.categories || []).map((row) => ({ _id: id("categories", row.id), legacyId: row.id, name: row.name, slug: slug(row.slug, `category-${row.id}`), parent: null, banner: row.banner, icon: row.icon, commissionRate: number(row.commision_rate), featured: bool(row.featured), top: bool(row.top), digital: bool(row.digital), active: true, metaTitle: row.meta_title, metaDescription: row.meta_description, ...timestamps(row) })),
  ...(tables.sub_categories || []).map((row) => ({ _id: id("sub_categories", row.id), legacyId: row.id, name: row.name, slug: `${slug(row.slug, "subcategory")}-sub-${row.id}`, parent: id("categories", row.category_id), active: true, ...timestamps(row) })),
  ...(tables.sub_sub_categories || []).map((row) => ({ _id: id("sub_sub_categories", row.id), legacyId: row.id, name: row.name, slug: `${slug(row.slug, "subsubcategory")}-leaf-${row.id}`, parent: id("sub_categories", row.sub_category_id), active: true, ...timestamps(row) })),
];

const brands = (tables.brands || []).map((row) => ({ _id: id("brands", row.id), legacyId: row.id, name: row.name, slug: slug(row.slug, `brand-${row.id}`), logo: row.logo, top: bool(row.top), active: true, metaTitle: row.meta_title, metaDescription: row.meta_description, ...timestamps(row) }));

const sellerByUser = new Map((tables.sellers || []).map((row) => [String(row.user_id), row]));
const shops = (tables.shops || []).map((row) => {
  const seller = sellerByUser.get(String(row.user_id)) || {};
  return { _id: id("shops", row.id), legacyId: row.id, owner: id("users", row.user_id), name: row.name || `Shop ${row.id}`, slug: slug(row.slug, `shop-${row.id}`), logo: row.logo, sliders: json(row.sliders, []), address: row.address, social: { facebook: row.facebook, google: row.google, twitter: row.twitter, youtube: row.youtube, instagram: row.instagram }, metaTitle: row.meta_title, metaDescription: row.meta_description, shippingCost: number(row.shipping_cost), cashOnDelivery: bool(seller.cash_on_delivery_status), adminToPay: number(seller.admin_to_pay), verificationInfo: json(seller.verification_info, []), bank: { name: seller.bank_name, accountName: seller.bank_acc_name, accountNumber: seller.bank_acc_no, routingNumber: seller.bank_routing_no }, verificationStatus: bool(seller.verification_status) ? "approved" : "pending", active: true, ...timestamps(row) };
});

const stocksByProduct = new Map();
for (const stock of tables.product_stocks || []) {
  const key = String(stock.product_id);
  if (!stocksByProduct.has(key)) stocksByProduct.set(key, []);
  stocksByProduct.get(key).push({ name: String(stock.variant || "").trim(), sku: stock.sku || undefined, price: Math.max(0, number(stock.price)), stock: Math.max(0, number(stock.qty)), legacyId: stock.id });
}

const products = (tables.products || []).map((row) => ({
  _id: id("products", row.id), legacyId: row.id, name: row.name, slug: slug(row.slug, `product-${row.id}`),
  seller: id("users", row.user_id), addedBy: row.added_by === "admin" ? "admin" : "seller",
  category: id("categories", row.category_id), subcategory: id("sub_categories", row.subcategory_id), subsubcategory: id("sub_sub_categories", row.subsubcategory_id), brand: id("brands", row.brand_id),
  photos: json(row.photos, []), thumbnail: row.thumbnail_img, video: { provider: row.video_provider, url: row.video_link },
  tags: String(row.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean), description: row.description || "",
  unitPrice: Math.max(0, number(row.unit_price)), purchasePrice: Math.max(0, number(row.purchase_price)),
  discount: Math.max(0, number(row.discount)), discountType: row.discount_type === "percent" ? "percent" : "amount",
  tax: Math.max(0, number(row.tax)), taxType: row.tax_type === "percent" ? "percent" : "amount", stock: Math.max(0, number(row.current_stock)),
  unit: row.unit || "pc", minQuantity: Math.max(1, number(row.min_qty, 1)), shippingType: ["free", "flat_rate", "seller_wise", "product_wise"].includes(row.shipping_type) ? row.shipping_type : "flat_rate",
  shippingCost: Math.max(0, number(row.shipping_cost)), sales: Math.max(0, number(row.num_of_sale)), rating: Math.min(5, Math.max(0, number(row.rating))),
  published: bool(row.published), featured: bool(row.featured), todaysDeal: bool(row.todays_deal), digital: bool(row.digital), attributes: { choices: json(row.choice_options, []), colors: json(row.colors, []) }, variants: stocksByProduct.get(String(row.id)) || json(row.variations, []),
  metaTitle: row.meta_title, metaDescription: row.meta_description, metaImage: row.meta_img, digitalFile: { name: row.file_name, path: row.file_path }, ...timestamps(row),
}));

const detailsByOrder = new Map();
for (const detail of tables.order_details || []) { const key = String(detail.order_id); if (!detailsByOrder.has(key)) detailsByOrder.set(key, []); detailsByOrder.get(key).push(detail); }
const productById = new Map((tables.products || []).map((row) => [String(row.id), row]));
const userById = new Map((tables.users || []).map((row) => [String(row.id), row]));
const categoryById = new Map((tables.categories || []).map((row) => [String(row.id), row]));
const businessByType = new Map((tables.business_settings || []).map((row) => [String(row.type).trim(), row.value]));
const globalCommission = Math.min(100, Math.max(0, number(businessByType.get("vendor_commission"))));
const categoryWiseCommission = bool(businessByType.get("category_wise_commission"));
const orders = (tables.orders || []).map((row) => {
  const shippingAddress = json(row.shipping_address, {});
  const items = (detailsByOrder.get(String(row.id)) || []).map((detail) => {
    const product = productById.get(String(detail.product_id)) || {};
    const quantity = Math.max(1, number(detail.quantity, 1));
    const total = Math.max(0, number(detail.price) + number(detail.tax) + number(detail.shipping_cost));
    const seller = userById.get(String(detail.seller_id || product.user_id));
    const rate = seller?.user_type === "seller" ? (categoryWiseCommission ? number(categoryById.get(String(product.category_id))?.commision_rate) : globalCommission) : 0;
    const commission = Math.max(0, total * rate / 100);
    return { _id: id("order_details", detail.id), product: product.id ? id("products", detail.product_id) : null, seller: id("users", detail.seller_id || product.user_id), name: product.name || `Archived product ${detail.product_id}`, slug: product.slug, image: product.thumbnail_img, variation: detail.variation, unitPrice: number(detail.price) / quantity, tax: number(detail.tax), shipping: number(detail.shipping_cost), quantity, total, commissionRate: rate, commission, sellerEarning: Math.max(0, total - commission), paymentStatus: detail.payment_status === "paid" ? "paid" : "unpaid", deliveryStatus: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].includes(detail.delivery_status) ? detail.delivery_status : "pending" };
  });
  const total = Math.max(0, number(row.grand_total));
  const itemSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = items.reduce((sum, item) => sum + item.tax, 0);
  const shipping = items.reduce((sum, item) => sum + item.shipping, 0);
  const paymentMethod = row.payment_type === "cash_on_delivery" ? "cod" : ["cod", "wallet", "stripe", "paypal", "razorpay", "manual"].includes(row.payment_type) ? row.payment_type : "manual";
  return { _id: id("orders", row.id), legacyId: row.id, code: row.code || `LEGACY-${row.id}`, customer: row.user_id ? id("users", row.user_id) : null, guestEmail: !row.user_id ? shippingAddress.email : undefined, shippingAddress: { name: shippingAddress.name, email: shippingAddress.email, address: shippingAddress.address, country: shippingAddress.country, state: shippingAddress.state, city: shippingAddress.city, postalCode: shippingAddress.postal_code, phone: shippingAddress.phone }, items, subtotal: Math.max(0, itemSubtotal), tax: Math.max(0, tax), shipping: Math.max(0, shipping), discount: Math.max(0, itemSubtotal + tax + shipping - total), total, payment: { method: paymentMethod, status: row.payment_status === "paid" ? "paid" : "unpaid", transactionId: row.payment_details || undefined }, status: items.every((item) => item.deliveryStatus === "delivered") ? "delivered" : "pending", statusHistory: [{ status: "pending", at: date(row.created_at) || new Date(), note: "Imported legacy order" }], commissionCalculated: bool(row.commission_calculated), ...timestamps(row) };
});

const addresses = (tables.addresses || []).map((row) => ({ _id: id("addresses", row.id), legacyId: row.id, user: id("users", row.user_id), label: "Home", recipient: row.name, address: row.address || "Imported address", country: row.country || "India", city: row.city || "Unknown", postalCode: row.postal_code || "Unknown", phone: row.phone || "Unknown", isDefault: bool(row.set_default), ...timestamps(row) }));
const wishlists = (tables.wishlists || []).filter((row) => productById.has(String(row.product_id))).map((row) => ({ _id: id("wishlists", row.id), legacyId: row.id, user: id("users", row.user_id), product: id("products", row.product_id), ...timestamps(row) }));
const cartsByUser = new Map();
for (const row of tables.carts || []) {
  if (!productById.has(String(row.product_id))) continue;
  const key = String(row.user_id);
  if (!cartsByUser.has(key)) cartsByUser.set(key, { _id: id("carts", row.user_id), user: id("users", row.user_id), items: [], expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), ...timestamps(row) });
  cartsByUser.get(key).items.push({ _id: id("cart_items", row.id), product: id("products", row.product_id), variation: row.variation, quantity: Math.max(1, number(row.quantity, 1)) });
}
const carts = [...cartsByUser.values()];
const reviews = (tables.reviews || []).map((row) => ({ _id: id("reviews", row.id), legacyId: row.id, product: id("products", row.product_id), user: id("users", row.user_id), rating: Math.min(5, Math.max(1, number(row.rating, 1))), comment: row.comment, published: bool(row.status), ...timestamps(row) }));
const wallets = (tables.wallets || []).map((row) => ({ _id: id("wallets", row.id), legacyId: row.id, user: id("users", row.user_id), type: "recharge", amount: Math.max(0.01, number(row.amount, 0.01)), balanceAfter: 0, paymentMethod: row.payment_method, reference: row.payment_details, status: row.approval === 1 ? "completed" : row.approval === 2 ? "failed" : "pending", ...timestamps(row) }));
const coupons = (tables.coupons || []).map((row) => {
  const details = json(row.details, row.type === "product_base" ? [] : {});
  return { _id: id("coupons", row.id), legacyId: row.id, code: String(row.code || `LEGACY-${row.id}`).toUpperCase(), type: row.type === "product_base" ? "product" : "cart", products: Array.isArray(details) ? details.map((item) => id("products", item.product_id)).filter(Boolean) : [], discount: Math.max(0, number(row.discount)), discountType: row.discount_type === "percent" ? "percent" : "amount", minimumSpend: Array.isArray(details) ? 0 : Math.max(0, number(details.min_buy)), maximumDiscount: Array.isArray(details) ? null : Math.max(0, number(details.max_discount)) || null, startsAt: row.start_date ? new Date(number(row.start_date) * 1000) : undefined, endsAt: row.end_date ? new Date(number(row.end_date) * 1000) : undefined, active: true, ...timestamps(row) };
});
const repliesByTicket = new Map();
for (const reply of tables.ticket_replies || []) { const key = String(reply.ticket_id); if (!repliesByTicket.has(key)) repliesByTicket.set(key, []); repliesByTicket.get(key).push({ author: id("users", reply.user_id), message: reply.reply, attachment: reply.files, createdAt: date(reply.created_at) || new Date() }); }
const tickets = (tables.tickets || []).map((row) => ({ _id: id("tickets", row.id), legacyId: row.id, code: row.code || `TICKET-${row.id}`, user: id("users", row.user_id), subject: row.subject || "Imported support request", status: ["open", "pending", "answered", "closed"].includes(row.status) ? row.status : "open", messages: [{ author: id("users", row.user_id), message: row.details || row.subject, attachment: row.files, createdAt: date(row.created_at) || new Date() }, ...(repliesByTicket.get(String(row.id)) || [])], ...timestamps(row) }));
const messagesByConversation = new Map();
for (const message of tables.messages || []) { const key = String(message.conversation_id); if (!messagesByConversation.has(key)) messagesByConversation.set(key, []); messagesByConversation.get(key).push({ sender: id("users", message.user_id), body: message.message, readBy: [], createdAt: date(message.created_at) || new Date() }); }
const conversations = (tables.conversations || []).map((row) => ({ _id: id("conversations", row.id), legacyId: row.id, participants: [id("users", row.sender_id), id("users", row.receiver_id)].filter(Boolean), title: row.title || "Imported conversation", messages: messagesByConversation.get(String(row.id)) || [], ...timestamps(row) }));
const affiliateUsers = (tables.affiliate_users || []).map((row) => ({ _id: id("affiliate_users", row.id), legacyId: row.id, user: id("users", row.user_id), paypalEmail: row.paypal_email, bankInformation: row.bank_information, information: row.informations, balance: Math.max(0, number(row.balance)), status: bool(row.status) ? "active" : "inactive", ...timestamps(row) }));
const homeCategories = (tables.home_categories || []).map((row) => ({ _id: id("home_categories", row.id), legacyId: row.id, category: id("categories", row.category_id), children: json(row.subsubcategories, []), active: bool(row.status), ...timestamps(row) }));
const currencies = (tables.currencies || []).map((row) => ({ _id: id("currencies", row.id), legacyId: row.id, name: row.name, symbol: row.symbol, code: row.code, exchangeRate: number(row.exchange_rate, 1), active: bool(row.status), ...timestamps(row) }));
const languages = (tables.languages || []).map((row) => ({ _id: id("languages", row.id), legacyId: row.id, name: row.name, code: row.code, rtl: bool(row.rtl), active: true, translations: translationsByCode.get(row.code) || {}, ...timestamps(row) }));
const countries = (tables.countries || []).map((row) => ({ _id: id("countries", row.id), legacyId: row.id, code: row.code, name: row.name, active: bool(row.status), ...timestamps(row) }));
const addons = (tables.addons || []).map((row) => ({ _id: id("addons", row.id), legacyId: row.id, name: row.name, identifier: row.unique_identifier, version: row.version, active: bool(row.activated), image: row.image, ...timestamps(row) }));
const seoSettings = (tables.seo_settings || []).map((row) => ({ _id: id("seo_settings", row.id), legacyId: row.id, keyword: row.keyword, author: row.author, revisit: number(row.revisit), sitemapLink: row.sitemap_link, description: row.description, ...timestamps(row) }));
const settingDocuments = [
  ...(tables.business_settings || []).map((row) => ({ _id: id("business_settings", row.id), key: `business.${String(row.type).trim()}`, group: "business", value: row.value, public: false, ...timestamps(row) })),
  ...(tables.policies || []).map((row) => ({ _id: id("policies", row.id), key: `policy.${String(row.name || row.type || row.id).replace(/_?policy$/i, "").toLowerCase()}`, group: "policy", value: row.content, public: true, ...timestamps(row) })),
  ...(tables.general_settings || []).flatMap((row) => Object.entries(row).filter(([key]) => !["id", "created_at", "updated_at"].includes(key)).map(([key, value], index) => ({ _id: id("general_settings", `${row.id}-${index}`), key: `general.${key}`, group: "general", value, public: !["email", "phone", "address"].includes(key), ...timestamps(row) }))),
];
const sliders = (tables.sliders || []).map((row) => ({ ...generic(row, "sliders"), published: bool(row.published), ...timestamps(row) }));
settingDocuments.push({ _id: id("settings", "homepage.sliders"), key: "homepage.sliders", group: "homepage", value: sliders.filter((row) => row.published).map((row) => row.photo), public: true, createdAt: new Date(), updatedAt: new Date() });
const settings = [...new Map(settingDocuments.map((document) => [document.key, document])).values()];

const transformedNames = new Set(["users", "categories", "sub_categories", "sub_sub_categories", "brands", "shops", "products", "orders", "order_details", "addresses", "wishlists", "carts", "reviews", "wallets", "coupons", "tickets", "ticket_replies", "conversations", "messages", "affiliate_users", "home_categories", "currencies", "languages", "countries", "addons", "seo_settings", "business_settings", "policies", "general_settings", "sliders", "migrations", "oauth_access_tokens", "oauth_auth_codes", "oauth_clients", "oauth_personal_access_clients", "oauth_refresh_tokens", "password_resets"]);
const collectionNameMap = { affiliate_users: "affiliateusers", affiliate_withdraw_requests: "affiliatewithdrawrequests", seller_withdraw_requests: "withdrawrequests", customer_products: "classifiedproducts", flash_deals: "flashdeals", flash_deal_products: "flashdealproducts", home_categories: "homecategories", pickup_points: "pickuppoints", seo_settings: "seosettings", manual_payment_methods: "manualpaymentmethods", customer_packages: "customerpackages", customer_package_payments: "customerpackagepayments", ticket_replies: "ticketreplies", sub_categories: "categories", sub_sub_categories: "categories" };
const collections = { users, categories, brands, shops, products, orders, addresses, wishlists, carts, reviews, wallettransactions: wallets, coupons, settings, sliders, tickets, conversations, affiliateusers: affiliateUsers, homecategories: homeCategories, currencies, languages, countries, addons, seosettings: seoSettings, messages: [], ticketreplies: [] };
for (const [table, rows] of Object.entries(tables)) if (!transformedNames.has(table)) collections[collectionNameMap[table] || table.replaceAll("_", "")] = rows.map((row) => ({ ...generic(row, table), ...timestamps(row) }));

if (dryRun) {
  const counts = Object.fromEntries(Object.entries(collections).map(([name, documents]) => [name, documents.length]));
  const invalidProducts = products.filter((product) => !product.seller || !product.category || !product.name || !product.slug);
  const invalidOrders = orders.filter((order) => !order.code || !Array.isArray(order.items));
  console.log(JSON.stringify({ sourceTables: Object.keys(tables).length, collections: counts, totalDocuments: Object.values(counts).reduce((sum, count) => sum + count, 0), invalidProducts: invalidProducts.length, invalidOrders: invalidOrders.length }, null, 2));
  process.exit(invalidProducts.length || invalidOrders.length ? 1 : 0);
}

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined, serverSelectionTimeoutMS: 10_000 });
try {
  for (const [name, documents] of Object.entries(collections)) {
    const collection = mongoose.connection.db.collection(name);
    if (replace) await collection.deleteMany({});
    if (!documents.length) continue;
    const operations = documents.map((document) => ({ updateOne: { filter: { _id: document._id }, update: { $set: document }, upsert: true } }));
    const result = await collection.bulkWrite(operations, { ordered: false });
    console.log(`${name}: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
  }
  const indexes = {
    users: [[{ email: 1 }, { unique: true, name: "email_unique" }], [{ role: 1, status: 1 }, { name: "role_status" }]],
    categories: [[{ slug: 1 }, { unique: true, name: "slug_unique" }], [{ parent: 1, active: 1 }, { name: "parent_active" }]],
    brands: [[{ slug: 1 }, { unique: true, name: "slug_unique" }]],
    shops: [[{ slug: 1 }, { unique: true, name: "slug_unique" }], [{ owner: 1 }, { unique: true, name: "owner_unique" }]],
    products: [[{ slug: 1 }, { unique: true, name: "slug_unique" }], [{ name: "text", tags: "text", description: "text" }, { name: "catalog_text" }], [{ published: 1, featured: -1, sales: -1, createdAt: -1 }, { name: "catalog_listing" }], [{ seller: 1, published: 1 }, { name: "seller_catalog" }]],
    orders: [[{ code: 1 }, { unique: true, name: "code_unique" }], [{ idempotencyKey: 1 }, { unique: true, sparse: true, name: "idempotency_unique" }], [{ customer: 1, createdAt: -1 }, { name: "customer_history" }], [{ "items.seller": 1, createdAt: -1 }, { name: "seller_orders" }]],
    wishlists: [[{ user: 1, product: 1 }, { unique: true, name: "user_product_unique" }]],
    reviews: [[{ product: 1, user: 1 }, { unique: true, name: "product_user_unique" }]],
    coupons: [[{ code: 1 }, { unique: true, name: "code_unique" }]],
    settings: [[{ key: 1 }, { unique: true, name: "key_unique" }]],
    carts: [[{ user: 1 }, { unique: true, name: "user_unique" }], [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "cart_expiry" }]],
    apitokens: [[{ tokenHash: 1 }, { unique: true, name: "token_hash_unique" }], [{ user: 1, createdAt: -1 }, { name: "user_tokens" }], [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "token_expiry" }]],
    couponusages: [[{ coupon: 1, user: 1 }, { unique: true, partialFilterExpression: { user: { $type: "objectId" } }, name: "coupon_user_unique" }]],
    sellerledgers: [[{ order: 1, orderItem: 1, type: 1 }, { unique: true, name: "order_item_type_unique" }], [{ seller: 1, createdAt: -1 }, { name: "seller_history" }]],
    externalaccounts: [[{ provider: 1, providerAccountId: 1 }, { unique: true, name: "provider_account_unique" }], [{ user: 1, provider: 1 }, { unique: true, name: "external_user_provider_unique" }]],
    accounttokens: [[{ tokenHash: 1 }, { unique: true, name: "account_token_unique" }], [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "account_token_expiry" }], [{ email: 1, purpose: 1, createdAt: -1 }, { name: "account_token_history" }]],
    subscribers: [[{ email: 1 }, { unique: true, name: "subscriber_email_unique" }]],
    withdrawrequests: [[{ seller: 1, status: 1, createdAt: -1 }, { name: "seller_withdrawal_history" }]],
  };
  for (const [collectionName, definitions] of Object.entries(indexes)) {
    const collection = mongoose.connection.db.collection(collectionName);
    for (const [keys, options] of definitions) await collection.createIndex(keys, options);
  }
  console.log("MongoDB indexes verified.");
  await validateDatabase(mongoose.connection.db);
  console.log("MongoDB import completed.");
} finally {
  await mongoose.disconnect();
}
