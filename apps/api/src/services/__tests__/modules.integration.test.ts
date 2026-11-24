import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Server } from "node:http";

vi.mock("../../config/env.js", () => ({ env: {
  EMAIL_VERIFY_SECRET: "module-email-secret", JWT_ACCESS_SECRET: "module-access-secret", JWT_ACCESS_EXPIRES: "15m",
  JWT_REFRESH_SECRET: "module-refresh-secret", JWT_REFRESH_EXPIRES: "7d", UPLOAD_DRIVER: "local",
  API_PUBLIC_URL: "http://localhost:4000", NEXT_PUBLIC_APP_URL: "http://localhost:3000",
} }));
vi.mock("../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("../email.service.js", () => ({
  sendOrderConfirmationEmail: vi.fn(), sendConversationMessageEmail: vi.fn(),
  sendNewsletterCampaign: vi.fn().mockResolvedValue(1), isMailConfigured: vi.fn().mockResolvedValue(true),
}));
vi.mock("../invoice.service.js", () => ({ renderInvoiceBuffer: vi.fn() }));

import { createApp } from "../../app.js";
import { signAccessToken } from "../../utils/jwt.js";
import { User } from "../../models/User.js";
import { Product } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { Order } from "../../models/Order.js";
import { Review } from "../../models/Address.js";
import { Conversation } from "../../models/Support.js";
import { Shop } from "../../models/Shop.js";
import { SellerLedger } from "../../models/Ledger.js";
import { BusinessSetting, GeneralSetting, Addon } from "../../models/Settings.js";
import { CustomerProduct } from "../../models/CustomerProduct.js";
import { Currency, Language, Translation } from "../../models/Localization.js";
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail } from "../../models/Affiliate.js";
import { attachReferral, creditAffiliateForOrder } from "../affiliate.service.js";
import { convertAmount } from "../currency.service.js";
import { sendNewsletterCampaign } from "../email.service.js";
import { Subscriber, PickupPoint } from "../../models/Marketing.js";

const id = () => new mongoose.Types.ObjectId();
let repl: MongoMemoryReplSet;
let server: Server;
let base: string;

beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ binary: { version: "8.0.17" }, replSet: { count: 1 } });
  await mongoose.connect(repl.getUri(), { dbName: "module_regression" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/v1`;
}, 240_000);

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
  await mongoose.disconnect();
  await repl?.stop();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  await BusinessSetting.create({ shippingMode: "free", activation: { classifiedProduct: true } });
  await GeneralSetting.create({ defaultCurrency: "INR" });
});

async function account(role: "customer" | "seller" | "staff" | "admin" = "customer", permissions: string[] = []) {
  const user = await User.create({ name: role, email: `${id()}@example.test`, passwordHash: "unused", role, permissions });
  return { user, token: signAccessToken({ sub: String(user._id), role, permissions }) };
}

function request(url: string, token?: string, method = "GET", body?: unknown) {
  return fetch(`${base}${url}`, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function product(sellerId: unknown = null, categoryId?: unknown) {
  const category = categoryId ?? (await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 }))._id;
  return Product.create({ name: "Product", slug: `product-${id()}`, addedBy: sellerId ? "seller" : "admin", sellerId,
    categoryId: category, basePrice: 100, published: true, approvalStatus: "approved",
    variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
}

async function deliveredOrder(userId: unknown, p: InstanceType<typeof Product>) {
  return Order.create({ code: `order-${id()}`, userId, addressSnapshot: { city: "Pune" },
    details: [{ sellerId: p.sellerId, status: "delivered", deliveredAt: new Date(), subtotal: 100,
      commissionRate: 10, commissionAmount: 10,
      items: [{ productId: p._id, variantSku: "sku", name: p.name, quantity: 1, unitPrice: 100 }] }],
    grandTotal: 100, paymentMethod: "wallet", paymentStatus: "paid", status: "delivered", inventoryStatus: "confirmed",
    idempotencyKey: `order-${id()}` });
}

describe("review parity", () => {
  it("keeps the full star histogram across pagination and recomputes moderation totals", async () => {
    const { user: seller } = await account("seller");
    const { token: admin } = await account("admin");
    const { user: buyer, token } = await account();
    const p = await product(seller._id);
    const order = await deliveredOrder(buyer._id, p);
    const created = await request("/reviews", token, "POST", { productId: String(p._id), orderId: String(order._id), rating: 4 });
    expect(created.status).toBe(201);
    const review = await created.json() as { id: string };
    await Review.create({ userId: id(), orderId: id(), productId: p._id, rating: 2, approved: true });
    const page = await (await request(`/reviews/product/${p._id}?pageSize=1`)).json() as { total: number; items: unknown[]; ratingCounts: Record<string, number> };
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);
    expect(page.ratingCounts).toMatchObject({ "2": 1, "4": 1 });
    expect((await request(`/reviews/admin/${review.id}/moderate`, admin, "POST", { approved: false })).status).toBe(200);
    expect(await Product.findById(p._id)).toMatchObject({ ratingCount: 1, ratingAverage: 2 });
    expect((await request("/reviews", token, "POST", { productId: String(p._id), orderId: String(order._id), rating: 5 })).status).toBe(201);
    expect(await Product.findById(p._id)).toMatchObject({ ratingCount: 1, ratingAverage: 2 });
  });

  it("marks only the seller's own reviews read and rejects another seller's reply", async () => {
    const seller = await account("seller");
    const other = await account("seller");
    const p = await product(seller.user._id);
    const review = await Review.create({ productId: p._id, orderId: id(), userId: id(), rating: 5 });
    const first = await (await request("/reviews/seller", seller.token)).json() as { unread: number };
    expect(first.unread).toBe(1);
    expect((await (await request("/reviews/seller", seller.token)).json() as { unread: number }).unread).toBe(0);
    expect((await request(`/reviews/${review._id}/reply`, other.token, "POST", { sellerReply: "Forged" })).status).toBe(403);
  });

  it("rejects malformed pagination and honors review activation", async () => {
    expect((await request(`/reviews/product/${id()}?page=Infinity`)).status).toBe(400);
    const { user, token } = await account();
    const p = await product();
    const order = await deliveredOrder(user._id, p);
    await BusinessSetting.updateOne({}, { "activation.reviewSystem": false });
    expect((await request("/reviews", token, "POST", { productId: String(p._id), orderId: String(order._id), rating: 5 })).status).toBe(403);
  });
});

describe("conversation parity and permissions", () => {
  it("restricts cross-thread staff deletion to conversation managers", async () => {
    const buyer = await account();
    const seller = await account("seller");
    const staff = await account("staff");
    const manager = await account("staff", ["conversations.manage"]);
    const created = await request("/conversations", buyer.token, "POST", { otherUserId: String(seller.user._id), message: "Question" });
    expect(created.status).toBe(201);
    const thread = await created.json() as { id: string };
    expect((await request(`/conversations/${thread.id}`, staff.token, "DELETE")).status).toBe(404);
    expect((await request(`/conversations/${thread.id}`, manager.token, "DELETE")).status).toBe(204);
  });

  it("refuses banned product owners and routes in-house enquiries to the store team", async () => {
    const buyer = await account();
    const seller = await account("seller");
    const p = await product(seller.user._id);
    await User.updateOne({ _id: seller.user._id }, { banned: true });
    expect((await request("/conversations", buyer.token, "POST", { otherUserId: String(seller.user._id), productId: String(p._id), message: "Question" })).status).toBe(403);
    const other = await account("seller");
    const inhouse = await product();
    expect((await request("/conversations", buyer.token, "POST", { otherUserId: String(other.user._id), productId: String(inhouse._id), message: "Question" })).status).toBe(400);
  });

  it("keeps product threads distinct and marks only received messages read", async () => {
    const buyer = await account();
    const seller = await account("seller");
    const p = await product(seller.user._id);
    const post = (extra = {}) => request("/conversations", buyer.token, "POST", { otherUserId: String(seller.user._id), message: "Question", ...extra });
    const first = await (await post({ productId: String(p._id) })).json() as { id: string };
    const second = await (await post()).json() as { id: string };
    expect(first.id).not.toBe(second.id);
    await request(`/conversations/${first.id}`, seller.token);
    expect((await Conversation.findById(first.id))!.messages[0]!.readAt).toBeInstanceOf(Date);
    expect((await Conversation.findById(second.id))!.messages[0]!.readAt).toBeUndefined();
  });
});

describe("report parity", () => {
  it("counts each populated seller's catalogue and descendants correctly", async () => {
    const { token } = await account("admin");
    const seller = await account("seller");
    await Shop.create({ sellerId: seller.user._id, name: "Shop", slug: `shop-${id()}`, verified: true });
    await product(seller.user._id);
    const response = await request("/admin/reports/seller-accounts", token);
    expect(response.status).toBe(200);
    const body = await response.json() as { items: { products: number; publishedProducts: number }[] };
    expect(body.items[0]).toMatchObject({ products: 1, publishedProducts: 1 });
  });

  it("nets commission reversals and rejects invalid scopes and dates", async () => {
    const { token } = await account("admin");
    const seller = await account("seller");
    await SellerLedger.create([
      { sellerId: seller.user._id, type: "sale", amount: 100 },
      { sellerId: seller.user._id, type: "commission", amount: -10 },
      { sellerId: seller.user._id, type: "commission", amount: 10 },
    ]);
    const result = await (await request(`/admin/reports/sellers?sellerId=${seller.user._id}`, token)).json() as { items: { commission: number }[] };
    expect(result.items[0]!.commission).toBe(0);
    expect((await request("/admin/reports/sellers?sellerId=invalid", token)).status).toBe(400);
    expect((await request("/admin/reports/sales?from=invalid", token)).status).toBe(400);
    expect((await request("/admin/reports/sales?from=2026-11-25&to=2026-11-01", token)).status).toBe(400);
  });
});

describe("localization parity", () => {
  it("rejects zero currency rates and converts with the target precision", async () => {
    const { token } = await account("admin");
    expect((await request("/localization/admin/currencies", token, "POST", { code: "USD", symbol: "$", rateToBase: 0 })).status).toBe(422);
    await Currency.create([{ code: "INR", symbol: "₹", rateToBase: 1 }, { code: "JPY", symbol: "¥", rateToBase: 0.5, decimals: 0 }]);
    expect(await convertAmount(1.24, "INR", "JPY")).toBe(2);
    await Currency.updateOne({ code: "JPY" }, { rateToBase: 0 });
    expect(await convertAmount(1.24, "INR", "JPY")).toBe(1.24);
  });

  it("preserves target translations when copying and treats search as literal text", async () => {
    const { token } = await account("admin");
    await Language.create([{ code: "en", name: "English" }, { code: "hi", name: "Hindi" }]);
    await Translation.create([{ languageCode: "en", key: "nav.shop", value: "Shop" }, { languageCode: "hi", key: "nav.shop", value: "Store" }]);
    expect((await request("/localization/admin/translations/copy", token, "POST", { fromCode: "en", toCode: "hi" })).status).toBe(200);
    expect((await Translation.findOne({ languageCode: "hi" }))!.value).toBe("Store");
    expect((await request("/localization/admin/translations?code=hi&q=%28", token)).status).toBe(200);
    expect((await request("/localization/admin/translations/copy", token, "POST", { fromCode: "en", toCode: "zz" })).status).toBe(404);
    expect((await request("/localization/admin/translations", token, "PUT", { languageCode: "en", entries: [{ key: "__proto__.polluted", value: "yes" }] })).status).toBe(422);
  });
});

describe("classified and newsletter parity", () => {
  it("validates pagination and searches locations literally", async () => {
    const p = await product();
    await CustomerProduct.create({ userId: id(), title: "Listing", slug: `listing-${id()}`, categoryId: p.categoryId, price: 1, status: "approved", location: "Pune (East)" });
    const response = await request("/addons/classifieds?location=%28");
    expect(response.status).toBe(200);
    expect((await response.json() as { total: number }).total).toBe(1);
    expect((await request("/addons/classifieds?pageSize=-1")).status).toBe(400);
  });

  it("deduplicates selected campaign addresses and never expands an empty selection", async () => {
    const { token } = await account("admin");
    await Subscriber.create({ email: "buyer@example.test" });
    const response = await request("/newsletter/admin/send", token, "POST", { subject: "News", body: "Hello", emails: ["buyer@example.test", "BUYER@example.test"] });
    expect(response.status).toBe(200);
    expect((await response.json() as { queued: number }).queued).toBe(1);
    expect(sendNewsletterCampaign).toHaveBeenCalledWith(["buyer@example.test"], "News", "Hello");
    expect((await request("/newsletter/admin/send", token, "POST", { subject: "News", body: "Hello", emails: [] })).status).toBe(422);
  });
});

describe("affiliate retry and first purchase safety", () => {
  it("awards a signup bonus once across concurrent attachment and never changes an existing referrer", async () => {
    await Addon.create({ key: "affiliate", enabled: true });
    await AffiliateConfig.create({ enabled: true, actionBonuses: { signup: 10 } });
    const referrer = await account();
    const buyer = await account();
    const affiliate = await AffiliateUser.create({ userId: referrer.user._id, referralCode: `ref-${id()}`, status: "approved" });
    await Promise.all([attachReferral(String(buyer.user._id), affiliate.referralCode), attachReferral(String(buyer.user._id), affiliate.referralCode)]);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(10);
  });

  it("does not pay a second first-purchase bonus when orders settle out of creation order", async () => {
    await Addon.create({ key: "affiliate", enabled: true });
    await AffiliateConfig.create({ enabled: true, firstPurchase: { enabled: true, percent: 10 } });
    const referrer = await account();
    const buyer = await account();
    await User.updateOne({ _id: buyer.user._id }, { referredBy: referrer.user._id });
    const affiliate = await AffiliateUser.create({ userId: referrer.user._id, referralCode: `ref-${id()}`, status: "approved" });
    const p = await product();
    const first = await deliveredOrder(buyer.user._id, p);
    const second = await deliveredOrder(buyer.user._id, p);
    await Order.updateOne({ _id: first._id }, { paymentStatus: "unpaid", createdAt: new Date(Date.now() - 60000) });
    await creditAffiliateForOrder(String(second._id));
    await Order.updateOne({ _id: first._id }, { paymentStatus: "paid" });
    await creditAffiliateForOrder(String(first._id));
    expect(await AffiliateEarningDetail.countDocuments({ affiliateUserId: affiliate._id })).toBe(1);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(10);
  });
});
