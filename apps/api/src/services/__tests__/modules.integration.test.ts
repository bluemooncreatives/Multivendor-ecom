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
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail, AffiliatePayment } from "../../models/Affiliate.js";
import { attachReferral, creditAffiliateForOrder } from "../affiliate.service.js";
import { convertAmount } from "../currency.service.js";
import { sendNewsletterCampaign } from "../email.service.js";
import { Subscriber, PickupPoint } from "../../models/Marketing.js";
import { Wallet, WalletTransaction } from "../../models/Wallet.js";
import { ClubPointTransaction } from "../../models/ClubPoints.js";
import { awardClubPointsForOrder } from "../clubpoints.service.js";
import { JobLock, withJobLock } from "../scheduler.service.js";
import { Cart } from "../../models/Cart.js";
import { createOrder } from "../checkout.service.js";
import { setCartItem } from "../cart.service.js";
import { RefundRequest } from "../../models/Refund.js";
import { Page, Policy } from "../../models/Content.js";

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
  it("paginates reviews with identical timestamps without duplicates or omissions", async () => {
    const p = await product();
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const rows = await Review.create(Array.from({ length: 25 }, (_, index) => ({
      productId: p._id, userId: id(), orderId: id(), rating: 5,
      comment: `Tied review ${index}`, createdAt,
    })));
    const expected = rows.map((row) => String(row._id)).sort().reverse();
    const seen: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const result = await (await request(`/reviews/product/${p._id}?page=${page}&pageSize=10`)).json() as { items: { id: string }[] };
      seen.push(...result.items.map((row) => row.id));
    }
    expect(seen).toEqual(expected);
  });

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
  it("offers built-in grants after migration and requires the report grant separately from order management", async () => {
    const admin = await account("admin");
    const reporter = await account("staff", ["reports.view"]);
    const orderManager = await account("staff", ["orders.manage"]);
    const permissions = await (await request("/admin/permissions", admin.token)).json() as { items: { key: string }[] };
    expect(permissions.items.some((permission) => permission.key === "pos.manage")).toBe(true);
    expect((await request("/admin/reports/sales", reporter.token)).status).toBe(200);
    expect((await request("/admin/reports/sales", orderManager.token)).status).toBe(403);
  });
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
    await Currency.create([{ code: "INR", name: "Rupee", symbol: "₹", rateToBase: 1 }, { code: "JPY", name: "Yen", symbol: "¥", rateToBase: 0.5, decimals: 0 }]);
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

describe("affiliate configuration replay", () => {
  it("does not add new earning kinds when a settled order is replayed after configuration changes", async () => {
    await Addon.create({ key: "affiliate", enabled: true });
    const config = await AffiliateConfig.create({ enabled: true, productSharing: { enabled: true, commissionType: "percent", commission: 10 } });
    const owner = await account();
    const buyer = await account();
    const affiliate = await AffiliateUser.create({ userId: owner.user._id, referralCode: `once-${id()}`, status: "approved" });
    const p = await product();
    const order = await deliveredOrder(buyer.user._id, p);
    order.details[0]!.items[0]!.productReferralCode = affiliate.referralCode;
    await order.save();
    await creditAffiliateForOrder(String(order._id));
    await AffiliateConfig.updateOne({ _id: config._id }, {
      "productSharing.enabled": false, "categorySharing.enabled": true,
      "categorySharing.rates": [{ categoryId: p.categoryId, commissionType: "amount", commission: 50 }],
    });
    await creditAffiliateForOrder(String(order._id));
    expect(await AffiliateEarningDetail.countDocuments({ orderId: order._id })).toBe(1);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(10);
  });
});

describe("affiliate payout accounting", () => {
  async function affiliateBalance() {
    await Addon.create({ key: "affiliate", enabled: true });
    await AffiliateConfig.create({ enabled: true, minWithdrawAmount: 1, allowedMethods: ["wallet", "manual"] });
    const owner = await account();
    const affiliate = await AffiliateUser.create({ userId: owner.user._id, referralCode: `pay-${id()}`, status: "approved", availableBalance: 100, totalEarnings: 100 });
    return { owner, affiliate, admin: await account("admin") };
  }

  it("serializes pending withdrawal holds and credits a wallet payout exactly once", async () => {
    const { owner, affiliate, admin } = await affiliateBalance();
    const responses = await Promise.all([1, 2].map(() => request("/addons/affiliate/withdrawals", owner.token, "POST", { amount: 80, method: "wallet" })));
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const withdrawal = await responses.find((r) => r.status === 201)!.json() as { id: string };
    const resolve = () => request(`/addons/admin/affiliate/withdrawals/${withdrawal.id}/resolve`, admin.token, "POST", { approve: true });
    expect((await resolve()).status).toBe(200);
    expect((await resolve()).status).toBe(409);
    expect((await Wallet.findOne({ userId: owner.user._id }))!.balance).toBe(80);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(20);
    expect(await WalletTransaction.countDocuments({ userId: owner.user._id })).toBe(1);
  });

  it("deducts direct payouts, honors holds, and replays a payout key without double payment", async () => {
    const { owner, affiliate, admin } = await affiliateBalance();
    expect((await request("/addons/affiliate/withdrawals", owner.token, "POST", { amount: 80, method: "manual" })).status).toBe(201);
    const pay = (amount: number, key: string) => request(`/addons/admin/affiliate/users/${affiliate._id}/pay`, admin.token, "POST", { amount, idempotencyKey: key });
    expect((await pay(30, "payout-rejected")).status).toBe(409);
    expect((await pay(20, "payout-replayed")).status).toBe(201);
    expect((await pay(20, "payout-replayed")).status).toBe(201);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(80);
    expect(await AffiliatePayment.countDocuments()).toBe(1);
  });
});

describe("shipment rewards and refunds", () => {
  it("awards only delivered paid shipments, using the purchase snapshot and transactionally on retry", async () => {
    await Addon.create({ key: "club_points", enabled: true });
    const buyer = await account();
    const seller = await account("seller");
    const p = await product();
    const other = await product(seller.user._id);
    const order = await deliveredOrder(buyer.user._id, p);
    order.details[0]!.items[0]!.clubPoints = 7;
    order.details.push({ ...order.details[0]!.toObject(), sellerId: seller.user._id, status: "confirmed",
      items: [{ productId: other._id, variantSku: "sku", name: "Other", quantity: 1, unitPrice: 100, clubPoints: 11 }] } as never);
    order.status = "shipped";
    await order.save();
    await Product.updateMany({}, { clubPoints: 99 });
    await Promise.all([awardClubPointsForOrder(String(order._id)), awardClubPointsForOrder(String(order._id))]);
    expect((await User.findById(buyer.user._id))!.clubPoints).toBe(7);
    expect(await ClubPointTransaction.countDocuments()).toBe(1);
    await Order.updateOne({ _id: order._id }, { paymentStatus: "unpaid", "details.1.status": "delivered" });
    await awardClubPointsForOrder(String(order._id));
    expect((await User.findById(buyer.user._id))!.clubPoints).toBe(7);
  });

  it("refunds one shipment once, reversing its rewards and affiliate share while retaining the other shipment", async () => {
    await Addon.create({ key: "club_points", enabled: true });
    const buyer = await account();
    const admin = await account("admin");
    const seller = await account("seller");
    const p = await product();
    const order = await deliveredOrder(buyer.user._id, p);
    order.details[0]!.items[0]!.clubPoints = 7;
    order.details.push({ ...order.details[0]!.toObject(), sellerId: seller.user._id } as never);
    order.grandTotal = 200;
    await order.save();
    await awardClubPointsForOrder(String(order._id));
    const affiliateOwner = await account();
    const affiliate = await AffiliateUser.create({ userId: affiliateOwner.user._id, referralCode: `refund-${id()}`, status: "approved", totalEarnings: 20, availableBalance: 20 });
    await AffiliateEarningDetail.create({ affiliateUserId: affiliate._id, orderId: order._id, kind: "order_commission", amount: 20, status: "credited" });
    const requests = await Promise.all([1, 2].map(() => request("/addons/refunds", buyer.token, "POST", { orderId: String(order._id), sellerId: null, reason: "Return" })));
    expect(requests.map((r) => r.status).sort()).toEqual([201, 409]);
    const refund = await requests.find((r) => r.status === 201)!.json() as { id: string };
    expect((await request(`/addons/refunds/${refund.id}/resolve`, admin.token, "POST", { approve: true })).status).toBe(200);
    expect((await request(`/addons/refunds/${refund.id}/resolve`, admin.token, "POST", { approve: true })).status).toBe(409);
    expect((await User.findById(buyer.user._id))!.clubPoints).toBe(7);
    expect((await AffiliateUser.findById(affiliate._id))!.availableBalance).toBe(10);
    expect((await Wallet.findOne({ userId: buyer.user._id }))!.balance).toBe(100);
    expect((await Order.findById(order._id))!.details[1]!.status).toBe("delivered");
  });
});

describe("pickup staff scoping", () => {
  it("shows only assigned collection points and their shipments and only fulfills those shipments", async () => {
    const staff = await account("staff", ["pickuppoints.manage"]);
    const otherStaff = await account("staff", ["pickuppoints.manage"]);
    const buyer = await account();
    const own = await PickupPoint.create({ name: "Own", address: "Street", city: "Pune", staffId: staff.user._id });
    const other = await PickupPoint.create({ name: "Other", address: "Street", city: "Pune", staffId: otherStaff.user._id });
    const p = await product();
    const order = await deliveredOrder(buyer.user._id, p);
    order.details[0]!.pickupPointId = own._id;
    order.details[0]!.status = "confirmed";
    order.details.push({ ...order.details[0]!.toObject(), sellerId: id(), pickupPointId: other._id } as never);
    order.status = "confirmed";
    await order.save();
    const points = await (await request("/pickup-points/admin", staff.token)).json() as { items: { id: string }[] };
    expect(points.items.map((point) => point.id)).toEqual([String(own._id)]);
    expect((await request(`/admin/orders/by-pickup-point?pickupPointId=${other._id}`, staff.token)).status).toBe(404);
    const sheet = await (await request(`/admin/orders/by-pickup-point?pickupPointId=${own._id}`, staff.token)).json() as { items: { details: unknown[]; idempotencyKey?: string }[] };
    expect(sheet.items[0]!.details).toHaveLength(1);
    expect(sheet.items[0]!.idempotencyKey).toBeUndefined();
    const fulfill = (status: string) => request(`/pickup-points/admin/${own._id}/orders/${order._id}`, staff.token, "PATCH", { sellerId: null, status });
    expect((await fulfill("delivered")).status).toBe(200);
    expect((await fulfill("processing")).status).toBe(409);
    expect((await Order.findById(order._id))!.details[1]!.status).toBe("confirmed");
    expect((await request(`/pickup-points/admin/${other._id}`, staff.token, "PATCH", { name: "Hijacked" })).status).toBe(404);
  });
});

describe("point of sale quote and access", () => {
  it("quotes discounts, tax and delivery without consuming stock and charges the same quote", async () => {
    await Addon.create({ key: "pos", enabled: true });
    const admin = await account("admin");
    const buyer = await account();
    const p = await product();
    await Product.updateOne({ _id: p._id }, { tax: 10, taxType: "percent", discount: 20, discountType: "percent" });
    const input = { items: [{ productId: String(p._id), variantSku: "sku", quantity: 2 }], discount: 10, shippingCost: 5 };
    const quote = await request("/addons/pos/quote", admin.token, "POST", input);
    expect(quote.status).toBe(200);
    const totals = await quote.json() as { grandTotal: number };
    expect(totals).toMatchObject({ subtotal: 160, tax: 16, discount: 10, shippingCost: 5, grandTotal: 171 });
    expect((await Product.findById(p._id))!.variants[0]!.stock).toBe(10);
    const sale = await request("/addons/pos/sales", admin.token, "POST", { ...input, customerId: String(buyer.user._id), idempotencyKey: `pos-${id()}` });
    expect(sale.status).toBe(201);
    expect((await sale.json() as { grandTotal: number }).grandTotal).toBe(totals.grandTotal);
    expect((await Product.findById(p._id))!.variants[0]!.stock).toBe(8);
  });

  it("requires a POS grant for staff, applies current permission revocations and rejects deleted accounts", async () => {
    await Addon.create({ key: "pos", enabled: true });
    const staff = await account("staff", ["pos.manage"]);
    expect((await request("/addons/pos/products?q=xx", staff.token)).status).toBe(200);
    await User.updateOne({ _id: staff.user._id }, { permissions: [] });
    expect((await request("/addons/pos/products?q=xx", staff.token)).status).toBe(403);
    await User.deleteOne({ _id: staff.user._id });
    expect((await request("/auth/me", staff.token)).status).toBe(401);
  });
});

describe("maintenance lease ownership", () => {
  it("never unlocks a newer owner's lease when old work finishes late", async () => {
    let finish!: () => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    const pending = withJobLock("lease-test", 15, async () => { started(); await new Promise<void>((resolve) => { finish = resolve; }); return "old"; });
    await ready;
    await JobLock.updateOne({ _id: "lease-test" }, { owner: "replacement", lockedUntil: new Date(Date.now() + 60000) });
    finish();
    await pending;
    const lock = await JobLock.findById("lease-test");
    expect(lock!.owner).toBe("replacement");
    expect(lock!.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("storefront vendor visibility", () => {
  it("enforces verified and active sellers for browsing, carts, checkout and public shops without leaking verification documents", async () => {
    const seller = await account("seller");
    const buyer = await account();
    const p = await product(seller.user._id);
    const shop = await Shop.create({ sellerId: seller.user._id, name: "Private docs", slug: `shop-${id()}`, verified: false,
      verificationDocs: ["https://private.example.test/passport.pdf"], verificationAnswers: { passport: "private" } });
    expect((await request(`/catalog/products/${p.slug}`)).status).toBe(404);
    await expect(setCartItem({ userId: String(buyer.user._id) }, String(p._id), "sku", 1)).rejects.toThrow(/not found/);
    await Shop.updateOne({ _id: shop._id }, { verified: true });
    expect((await request(`/catalog/products/${p.slug}`)).status).toBe(200);
    const publicShop = await (await request(`/seller/shops/${shop.slug}`)).json() as Record<string, unknown>;
    expect(publicShop.verificationDocs).toBeUndefined();
    expect(publicShop.verificationAnswers).toBeUndefined();
    await setCartItem({ userId: String(buyer.user._id) }, String(p._id), "sku", 1);
    await User.updateOne({ _id: seller.user._id }, { banned: true });
    expect((await request(`/catalog/products/${p.slug}`)).status).toBe(404);
    await expect(createOrder({ owner: { userId: String(buyer.user._id) }, paymentMethod: "cod", idempotencyKey: `ban-${id()}`,
      address: { line1: "Street", city: "Pune", state: "MH", postalCode: "411001", country: "IN", phone: "9000000000" } })).rejects.toThrow(/available/);
    await User.updateOne({ _id: seller.user._id }, { banned: false });
    await BusinessSetting.updateOne({}, { "activation.vendorSystem": false });
    expect((await request(`/catalog/products/${p.slug}`)).status).toBe(404);
    const inhouse = await product();
    expect((await request(`/catalog/products/${inhouse.slug}`)).status).toBe(200);
  });
});

describe("CMS and reported revenue", () => {
  it("sanitizes legacy CMS pages and refuses script links on both write and public output", async () => {
    const admin = await account("admin");
    await Page.create({ slug: "unsafe-page", title: "Legacy", body: '<h2>Safe text</h2><script>bad()</script><img src="x" onerror="bad()"><a href="javascript:bad()">Link</a>', published: true });
    const response = await request("/cms/pages/unsafe-page");
    expect(response.status).toBe(200);
    const body = (await response.json() as { body: string }).body;
    expect(body).toContain("<h2>Safe text</h2>");
    expect(body).not.toMatch(/<script|onerror|javascript:/);
    await Policy.create({ type: "return", body: "<p>Configured return policy</p><script>bad()</script>" });
    const policy = await (await request("/cms/policies/return")).json() as { body: string };
    expect(policy.body).toBe("<p>Configured return policy</p>");
    await GeneralSetting.updateOne({}, { appName: "Configured marketplace", supportEmail: "help@example.test" });
    await BusinessSetting.updateOne({}, { smtp: { password: "private-smtp-value" } });
    const settings = await (await request("/cms/site-settings")).json() as { general: { appName: string } };
    expect(settings.general.appName).toBe("Configured marketplace");
    expect(JSON.stringify(settings)).not.toContain("private-smtp-value");
    expect((await request("/cms/admin/links", admin.token, "POST", { label: "Bad", url: "javascript:alert(1)", placement: "footer" })).status).toBe(422);
  });

  it("excludes unpaid checkouts from revenue and subtracts settled merchandise refunds", async () => {
    const admin = await account("admin");
    const buyer = await account();
    const p = await product();
    const paid = await deliveredOrder(buyer.user._id, p);
    const unpaid = await deliveredOrder(buyer.user._id, p);
    await Order.updateOne({ _id: unpaid._id }, { paymentStatus: "unpaid", grandTotal: 999 });
    await RefundRequest.create({ orderId: paid._id, userId: buyer.user._id, amount: 40, reason: "Partial", status: "refunded" });
    const totals = await (await request("/admin/reports/sales", admin.token)).json();
    expect(totals).toMatchObject({ orders: 2, grossRevenue: 100, refunded: 40, revenue: 60 });
  });
});
