import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

vi.mock("../../config/env.js", () => ({ env: {
  EMAIL_VERIFY_SECRET: "integration-email-secret-only", JWT_ACCESS_SECRET: "integration-access-secret-only", JWT_ACCESS_EXPIRES: "15m",
  JWT_REFRESH_SECRET: "integration-refresh-secret-only", JWT_REFRESH_EXPIRES: "7d", STRIPE_SECRET_KEY: "sk_test_integration_only",
  API_PUBLIC_URL: "http://localhost:4000", NEXT_PUBLIC_APP_URL: "http://localhost:3000", UPLOAD_DRIVER: "local",
} }));
vi.mock("../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("../email.service.js", () => ({ sendOrderConfirmationEmail: vi.fn() }));
vi.mock("../invoice.service.js", () => ({ renderInvoiceBuffer: vi.fn() }));

import { createOrder } from "../checkout.service.js";
import { cancelOrder } from "../order.service.js";
import { settleOrderPayment, failOrderPayment, recordPaymentEventOnce, completePaymentEvent, expireAbandonedOrders, listLateCaptures } from "../payment.service.js";
import { createPosSale } from "../pos.service.js";
import { runMaintenanceOnce, withJobLock, JobLock } from "../scheduler.service.js";
import { Product, FlashDeal } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { Cart } from "../../models/Cart.js";
import { Order } from "../../models/Order.js";
import { Coupon, CouponUsage } from "../../models/Coupon.js";
import { BusinessSetting, GeneralSetting, Addon } from "../../models/Settings.js";
import { Shop } from "../../models/Shop.js";
import { SellerPackage, SellerPackagePayment, CustomerPackage } from "../../models/Package.js";
import { purchaseSellerPackage, purchaseCustomerPackage, consumeSellerUpload, consumeCustomerUpload, assertSellerPackageValid, unpublishExpiredSellerProducts } from "../package.service.js";
import { SellerLedger } from "../../models/Ledger.js";
import { Wallet, WalletTransaction } from "../../models/Wallet.js";
import { User } from "../../models/User.js";
import { ClubPointConfig } from "../../models/ClubPoints.js";
import { mergeGuestCartIntoUser, setCartItem, getCartWithDetails } from "../cart.service.js";
import type { CheckoutInput } from "../checkout.service.js";
import { createApp } from "../../app.js";
import { signDownloadToken } from "../digitalproduct.service.js";
import { signAccessToken } from "../../utils/jwt.js";
import { storeUpload } from "../upload.service.js";
import { privateUploadsRoot } from "../../config/storage.js";
import fs from "node:fs/promises";
import path from "node:path";
import type { Server } from "node:http";
import { Ticket } from "../../models/Support.js";
import { login, refreshSession } from "../auth.service.js";
import { hashPassword } from "../../utils/password.js";
import { RefreshToken } from "../../models/RefreshToken.js";
import { Payment } from "../../models/Payment.js";
import { GatewayIntent } from "../../models/GatewayIntent.js";
import { AffiliateConfig, AffiliateUser, AffiliateEarningDetail } from "../../models/Affiliate.js";
import { assertVerifiedPayment } from "../gateways/shared.js";

let repl: MongoMemoryReplSet;
let server: Server;
let base: string;
const id = () => new mongoose.Types.ObjectId();

async function testAccessToken(payload: Parameters<typeof signAccessToken>[0]) {
  await User.updateOne({ _id: payload.sub }, { $setOnInsert: {
    name: "Test actor", email: `${payload.sub}@example.test`, passwordHash: "unused",
    role: payload.role, permissions: payload.permissions,
  } }, { upsert: true });
  return signAccessToken(payload);
}

const address = { line1: "Test street", city: "Pune", state: "MH", country: "IN", postalCode: "411001", phone: "9000000000" };

beforeAll(async () => {
  repl = await MongoMemoryReplSet.create({ binary: { version: "8.0.17" }, replSet: { count: 1 } });
  await mongoose.connect(repl.getUri(), { dbName: "migration_regression" });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}, 240_000);

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server?.close((error) => error ? reject(error) : resolve()));
  await mongoose.disconnect();
  await repl?.stop();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  await BusinessSetting.create({ shippingMode: "free" });
  await GeneralSetting.create({ defaultCurrency: "INR" });
});

async function fixture(overrides: Record<string, unknown> = {}, userId = id()) {
  const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
  const product = await Product.create({ name: "Product", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
    categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved",
    variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }], ...overrides });
  await Cart.create({ userId, items: [{ productId: product._id, variantSku: "sku", quantity: 2 }] });
  const input: CheckoutInput = { owner: { userId: String(userId) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` };
  return { product, category, input, userId };
}

async function stock(productId: unknown) {
  return (await Product.findById(productId))!.variants[0]!;
}

describe("checkout and settlement with real transactions", () => {
  it("marks COD paid without consuming stock or crediting the seller twice", async () => {
    const sellerId = id();
    const { product, input } = await fixture({ sellerId, addedBy: "seller" });
    const order = await createOrder(input);
    expect((await stock(product._id)).stock).toBe(8);
    expect(await SellerLedger.countDocuments({ orderId: order._id })).toBe(0);
    await Order.updateOne({ _id: order._id }, { status: "delivered", "details.0.status": "delivered" });
    await settleOrderPayment(String(order._id), "cod");
    await settleOrderPayment(String(order._id), "cod");
    const saved = await Order.findById(order._id);
    expect(saved!.status).toBe("delivered");
    expect(saved!.paymentStatus).toBe("paid");
    expect((await stock(product._id)).stock).toBe(8);
    expect((await stock(product._id)).reserved).toBe(0);
    const entries = await SellerLedger.find({ orderId: order._id });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.amount).toBe(-20);
  });

  it("settles a gateway payment once under concurrent callbacks", async () => {
    const { product, input } = await fixture({ sellerId: id(), addedBy: "seller" });
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    expect((await stock(product._id)).reserved).toBe(2);
    await Promise.all([settleOrderPayment(String(order._id), "stripe"), settleOrderPayment(String(order._id), "stripe")]);
    expect((await stock(product._id)).stock).toBe(8);
    expect((await stock(product._id)).reserved).toBe(0);
    expect(await SellerLedger.countDocuments({ orderId: order._id })).toBe(2);
  });

  it("repeated payment failure releases the hold once and cannot resurrect the order", async () => {
    const { product, input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    await failOrderPayment(String(order._id), "stripe");
    await failOrderPayment(String(order._id), "stripe");
    expect((await stock(product._id)).stock).toBe(10);
    expect((await stock(product._id)).reserved).toBe(0);
    await expect(settleOrderPayment(String(order._id), "stripe")).rejects.toThrow(/closed/);
    expect((await stock(product._id)).stock).toBe(10);
  });

  it("returns one order for concurrent retries of a checkout", async () => {
    const { product, input } = await fixture();
    const [first, retry] = await Promise.all([createOrder(input), createOrder(input)]);
    expect(String(first._id)).toBe(String(retry._id));
    expect(await Order.countDocuments()).toBe(1);
    expect((await stock(product._id)).stock).toBe(8);
  });

  it("does not disclose an order to a different owner reusing its checkout key", async () => {
    const { input } = await fixture();
    await createOrder(input);
    await expect(createOrder({ ...input, owner: { guestId: "different-owner" } })).rejects.toThrow(/already in use/);
  });

  it("rolls back coupon usage, inventory and wallet when checkout cannot be paid", async () => {
    const { product, input, userId } = await fixture();
    await Coupon.create({ code: "SAVE", type: "flat", value: 20 });
    await Wallet.create({ userId, balance: 5 });
    await expect(createOrder({ ...input, paymentMethod: "wallet", couponCode: "SAVE" })).rejects.toThrow(/Insufficient/);
    expect(await CouponUsage.countDocuments()).toBe(0);
    expect(await Order.countDocuments()).toBe(0);
    expect((await stock(product._id)).reserved).toBe(0);
    expect((await Wallet.findOne({ userId }))!.balance).toBe(5);
  });

  it("enforces the last coupon use across simultaneous orders for different products", async () => {
    const first = await fixture();
    const second = await fixture();
    await Coupon.create({ code: "LAST", type: "flat", value: 10, usageLimitTotal: 1 });
    const results = await Promise.allSettled([createOrder({ ...first.input, couponCode: "LAST" }), createOrder({ ...second.input, couponCode: "LAST" })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await CouponUsage.countDocuments()).toBe(1);
    expect(await Order.countDocuments()).toBe(1);
  });

  it("calculates category commission separately for each line in one seller shipment", async () => {
    const sellerId = id();
    const { product, category, input, userId } = await fixture({ sellerId, addedBy: "seller" });
    await BusinessSetting.updateOne({}, { "activation.categoryBasedCommission": true });
    await Category.updateOne({ _id: category._id }, { commissionRate: 10 });
    const otherCategory = await Category.create({ name: "Other", slug: "other", commissionRate: 25, level: 0 });
    const other = await Product.create({ ...product.toObject(), _id: id(), slug: "other", categoryId: otherCategory._id,
      basePrice: 200, variants: [{ sku: "sku2", price: 200, stock: 10 }] });
    await Cart.updateOne({ userId }, { items: [{ productId: product._id, variantSku: "sku", quantity: 1 }, { productId: other._id, variantSku: "sku2", quantity: 1 }] });
    const order = await createOrder(input);
    expect(order.details).toHaveLength(1);
    expect(order.details[0].commissionAmount).toBe(60);
    expect(order.details[0].commissionRate).toBe(20);
  });

  it("restores wallet payment and stock once on cancellation", async () => {
    const { product, input, userId } = await fixture();
    await Wallet.create({ userId, balance: 500 });
    const order = await createOrder({ ...input, paymentMethod: "wallet" });
    const requester = { id: String(userId), role: "customer" as const };
    await cancelOrder(String(order._id), requester);
    await cancelOrder(String(order._id), requester);
    expect((await Wallet.findOne({ userId }))!.balance).toBe(500);
    expect((await stock(product._id)).stock).toBe(10);
    expect(await WalletTransaction.countDocuments()).toBe(2);
  });

  it("restores redeemed points and coupon eligibility when payment fails", async () => {
    const user = await User.create({ name: "Buyer", email: "buyer@example.test", passwordHash: "unused", clubPoints: 50 });
    const { input } = await fixture({}, user._id);
    await Addon.create({ key: "club_points", enabled: true });
    await ClubPointConfig.create({ convertRate: 1, minConvertPoints: 1 });
    await Coupon.create({ code: "SAVE", type: "flat", value: 20 });
    const order = await createOrder({ ...input, paymentMethod: "stripe", couponCode: "SAVE", clubPoints: 10 });
    await failOrderPayment(String(order._id), "stripe");
    await failOrderPayment(String(order._id), "stripe");
    expect((await User.findById(user._id))!.clubPoints).toBe(50);
    expect(await CouponUsage.countDocuments()).toBe(0);
  });

  it("rejects disabled guest checkout, unapproved products and below-minimum quantities", async () => {
    const { input, product } = await fixture({ minOrderQty: 3 });
    await expect(createOrder(input)).rejects.toThrow(/Minimum quantity/);
    await Product.updateOne({ _id: product._id }, { minOrderQty: 1, approvalStatus: "rejected" });
    await expect(createOrder(input)).rejects.toThrow(/no longer available/);
    await Cart.create({ guestId: "guest", items: [{ productId: product._id, variantSku: "sku", quantity: 2 }] });
    await BusinessSetting.updateOne({}, { "activation.guestCheckout": false });
    await expect(createOrder({ ...input, owner: { guestId: "guest" } })).rejects.toThrow(/Sign in/);
  });

  it("retries a recorded webhook after failed processing, then deduplicates completion", async () => {
    expect(await recordPaymentEventOnce("stripe", "evt-retry", {})).toBe(true);
    expect(await recordPaymentEventOnce("stripe", "evt-retry", {})).toBe(true);
    await completePaymentEvent("stripe", "evt-retry");
    expect(await recordPaymentEventOnce("stripe", "evt-retry", {})).toBe(false);
  });

  it("POS wallet sales debit the wallet and reject insufficient funds without consuming stock", async () => {
    const customer = await User.create({ name: "Buyer", email: "pos@example.test", passwordHash: "unused" });
    const { product } = await fixture();
    await Wallet.create({ userId: customer._id, balance: 150 });
    const sale = { sellerId: null, operatorId: String(id()), allowAnySeller: true, customerId: String(customer._id),
      lines: [{ productId: String(product._id), variantSku: "sku", quantity: 1 }], paymentType: "wallet" as const };
    await createPosSale(sale);
    expect((await Wallet.findOne({ userId: customer._id }))!.balance).toBe(50);
    await expect(createPosSale(sale)).rejects.toThrow(/Insufficient/);
    expect((await stock(product._id)).stock).toBe(9);
  });

  it("guest cart merge skips deleted products without losing available lines", async () => {
    const { product, userId } = await fixture();
    await Cart.create({ guestId: "guest", items: [{ productId: id(), variantSku: "deleted", quantity: 1 }, { productId: product._id, variantSku: "sku", quantity: 1 }] });
    await mergeGuestCartIntoUser("guest", String(userId));
    expect((await Cart.findOne({ userId }))!.items[0]!.quantity).toBe(3);
    expect(await Cart.exists({ guestId: "guest" })).toBeNull();
    await Product.updateOne({ _id: product._id }, { published: false });
    await setCartItem({ userId: String(userId) }, String(product._id), "sku", 0);
    expect((await Cart.findOne({ userId }))!.items).toHaveLength(0);
  });

  it("serves paid digital files privately and revokes an issued link after cancellation", async () => {
    const ownerId = String(id());
    const stored = await storeUpload({ buffer: Buffer.from("%PDF-1.7 test"), originalname: "book.pdf", mimetype: "application/pdf", size: 13 }, "digital", ownerId);
    try {
      const { product, input, userId } = await fixture({ isDigital: true, digitalFileUrl: stored.url });
      await Wallet.create({ userId, balance: 500 });
      const order = await createOrder({ ...input, paymentMethod: "wallet" });
      expect((await Product.findById(product._id))!.digitalFileUrl).toBeUndefined();
      const token = signDownloadToken({ sub: String(userId), productId: String(product._id), orderId: String(order._id) });
      const response = await fetch(`${base}/api/v1/digital-products/download/${token}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(await response.text()).toBe("%PDF-1.7 test");
      expect((await fetch(`${base}/uploads/${stored.key}`)).status).toBe(404);
      await cancelOrder(String(order._id), { id: String(userId), role: "customer" });
      expect((await fetch(`${base}/api/v1/digital-products/download/${token}`)).status).toBe(403);
    } finally {
      await fs.unlink(path.join(privateUploadsRoot, stored.key));
    }
  });

  it("does not allow sellers or unprivileged staff to open another customer's ticket", async () => {
    const victim = id();
    const ticket = await Ticket.create({ userId: victim, subject: "Private", replies: [] });
    for (const role of ["seller", "staff"] as const) {
      const token = await testAccessToken({ sub: String(id()), role, permissions: [] });
      const response = await fetch(`${base}/api/v1/me/tickets/${ticket._id}`, { headers: { Authorization: `Bearer ${token}` } });
      expect(response.status).toBe(404);
    }
  });

  it("requires an owner on extra gateway sessions before contacting the provider", async () => {
    const { input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    expect((await fetch(`${base}/api/v1/payments/paystack/${order._id}/session`, { method: "POST" })).status).toBe(401);
    expect((await fetch(`${base}/api/v1/payments/paystack/${order._id}/session`, { method: "POST", headers: { "X-Guest-Id": "different-guest" } })).status).toBe(404);
  });

  it("rotates a refresh token atomically so concurrent reuse succeeds only once", async () => {
    await User.create({ name: "Buyer", email: "refresh@example.test", passwordHash: await hashPassword("password123") });
    const { tokens } = await login("refresh@example.test", "password123");
    const results = await Promise.allSettled([refreshSession(tokens.refreshToken), refreshSession(tokens.refreshToken)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(1);
  });

  it("preserves active reservations through admin product edits", async () => {
    const { product, input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    const token = await testAccessToken({ sub: String(id()), role: "admin" });
    const update = (variants: unknown[]) => fetch(`${base}/api/v1/catalog/admin/products/${product._id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ variants }),
    });
    expect((await update([{ sku: "sku", price: 100, stock: 10 }])).status).toBe(200);
    expect((await stock(product._id)).reserved).toBe(2);
    expect((await update([{ sku: "sku", price: 100, stock: 1 }])).status).toBe(409);
    expect((await update([{ sku: "replacement", price: 100, stock: 10 }])).status).toBe(409);
    await settleOrderPayment(String(order._id), "stripe");
    expect((await stock(product._id)).stock).toBe(8);
  });

  it("scopes seller order responses and refuses order access to staff without permission", async () => {
    const seller = id();
    const { input, product, userId } = await fixture({ sellerId: seller, addedBy: "seller" });
    const other = await Product.create({ ...product.toObject(), _id: id(), slug: "private-vendor", sellerId: id(), name: "Other vendor secret" });
    await Cart.updateOne({ userId }, { $push: { items: { productId: other._id, variantSku: "sku", quantity: 1 } } });
    const order = await createOrder(input);
    const sellerToken = await testAccessToken({ sub: String(seller), role: "seller" });
    const response = await fetch(`${base}/api/v1/orders/${order._id}`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    const body = await response.json() as { details: unknown[]; idempotencyKey?: string; grandTotal: number };
    expect(response.status).toBe(200);
    expect(body.details).toHaveLength(1);
    expect(body.idempotencyKey).toBeUndefined();
    expect(body.grandTotal).toBe(200);
    const staffToken = await testAccessToken({ sub: String(id()), role: "staff", permissions: [] });
    expect((await fetch(`${base}/api/v1/orders/${order._id}`, { headers: { Authorization: `Bearer ${staffToken}` } })).status).toBe(404);
  });

  it("requires gateway verification to match amount, currency and recorded provider reference", async () => {
    const { input } = await fixture();
    const order = await createOrder(input);
    await Order.updateOne({ _id: order._id }, { paymentMethod: "paystack" });
    await Payment.create({ orderId: order._id, method: "paystack", amount: 200, currency: "INR", providerRef: "actual", idempotencyKey: "verified-test" });
    await expect(assertVerifiedPayment(String(order._id), "paystack", 1, "INR", "actual")).rejects.toThrow(/amount/);
    await expect(assertVerifiedPayment(String(order._id), "paystack", 200, "USD", "actual")).rejects.toThrow(/currency/);
    await expect(assertVerifiedPayment(String(order._id), "paystack", 200, "INR", "other")).rejects.toThrow(/does not belong/);
    await expect(assertVerifiedPayment(String(order._id), "paystack", 200, "INR", "actual")).resolves.toBeUndefined();
  });

  it("quotes product coupons using the cart and ignores a forged client subtotal", async () => {
    const { input, product, userId } = await fixture();
    await Coupon.create({ code: "SPECIFIC", type: "percent", value: 10, scope: "product", productIds: [product._id] });
    const token = await testAccessToken({ sub: String(userId), role: "customer" });
    const response = await fetch(`${base}/api/v1/coupons/validate`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code: "SPECIFIC", orderSubtotal: 999999 }),
    });
    expect(response.status).toBe(200);
    expect((await response.json() as { discount: number }).discount).toBe(20);
    const order = await createOrder({ ...input, couponCode: "SPECIFIC" });
    expect(order.couponDiscount).toBe(20);
  });

  it("refunds the discounted amount for in-house goods once and revokes delivery entitlements", async () => {
    const { input, userId } = await fixture();
    await Wallet.create({ userId, balance: 500 });
    await Coupon.create({ code: "HALF", type: "percent", value: 50 });
    const order = await createOrder({ ...input, paymentMethod: "wallet", couponCode: "HALF" });
    await Order.updateOne({ _id: order._id }, { status: "delivered", "details.0.status": "delivered", "details.0.deliveredAt": new Date() });
    const token = await testAccessToken({ sub: String(userId), role: "customer" });
    const response = await fetch(`${base}/api/v1/addons/refunds`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: String(order._id), sellerId: "null", reason: "Return" }),
    });
    expect(response.status).toBe(201);
    const refund = await response.json() as { id: string; amount: number };
    expect(refund.amount).toBe(100);
    const admin = await testAccessToken({ sub: String(id()), role: "admin" });
    const approve = () => fetch(`${base}/api/v1/addons/refunds/${refund.id}/resolve`, {
      method: "POST", headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" }, body: JSON.stringify({ approve: true }),
    });
    expect((await approve()).status).toBe(200);
    expect((await approve()).status).toBe(409);
    expect((await Wallet.findOne({ userId }))!.balance).toBe(500);
    expect((await Order.findById(order._id))!.details[0]!.status).toBe("refunded");
  });

  it("allocates a product coupon only to its seller's shipment", async () => {
    const { input, product, userId } = await fixture({ sellerId: id(), addedBy: "seller" });
    const other = await Product.create({ ...product.toObject(), _id: id(), slug: "coupon-other-vendor", sellerId: id() });
    await Cart.updateOne({ userId }, { $push: { items: { productId: other._id, variantSku: "sku", quantity: 1 } } });
    await Coupon.create({ code: "FIRST", type: "percent", value: 50, scope: "product", productIds: [product._id] });
    const order = await createOrder({ ...input, couponCode: "FIRST" });
    expect(order.details.map((detail: { discount: number }) => detail.discount)).toEqual([100, 0]);
  });

  it("serializes payouts against the available balance and credits wallet payouts once", async () => {
    const seller = await User.create({ name: "Seller", email: "payout@example.test", passwordHash: "unused", role: "seller" });
    await SellerLedger.create({ sellerId: seller._id, type: "sale", amount: 100 });
    const admin = await testAccessToken({ sub: String(id()), role: "admin" });
    const pay = (key: string) => fetch(`${base}/api/v1/admin/sellers/${seller._id}/payouts`, {
      method: "POST", headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 80, method: "wallet", idempotencyKey: key }),
    });
    const responses = await Promise.all([pay("payout-attempt-one"), pay("payout-attempt-two")]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(80);
    const token = await testAccessToken({ sub: String(seller._id), role: "seller" });
    const summary = await (await fetch(`${base}/api/v1/seller/ledger/summary`, { headers: { Authorization: `Bearer ${token}` } })).json() as { available: number };
    expect(summary.available).toBe(20);
  });

  it("reserves withdrawal requests and does not subtract a paid withdrawal twice", async () => {
    const seller = await User.create({ name: "Seller", email: "withdraw@example.test", passwordHash: "unused", role: "seller" });
    await SellerLedger.create({ sellerId: seller._id, type: "sale", amount: 100 });
    const token = await testAccessToken({ sub: String(seller._id), role: "seller" });
    const request = () => fetch(`${base}/api/v1/seller/withdrawals`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: 80, method: "wallet" }),
    });
    const responses = await Promise.all([request(), request()]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    const approved = responses.find((response) => response.status === 201)!;
    const withdrawal = await approved.json() as { id: string };
    const admin = await testAccessToken({ sub: String(id()), role: "admin" });
    const approve = () => fetch(`${base}/api/v1/admin/withdrawals/${withdrawal.id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" }, body: JSON.stringify({ approve: true }),
    });
    const resolutions = await Promise.all([approve(), approve()]);
    expect(resolutions.map((response) => response.status).sort()).toEqual([200, 409]);
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(80);
    const summary = await (await fetch(`${base}/api/v1/seller/ledger/summary`, { headers: { Authorization: `Bearer ${token}` } })).json() as { available: number };
    expect(summary.available).toBe(20);
  });

  it("records one POS sale for concurrent retries from the same till", async () => {
    const { product } = await fixture();
    const sale = { sellerId: null, operatorId: String(id()), allowAnySeller: true, walkIn: { name: "Walk in", phone: "9000000000" },
      lines: [{ productId: String(product._id), variantSku: "sku", quantity: 1 }], paymentType: "cash" as const, idempotencyKey: "one-pos-attempt" };
    const [first, retry] = await Promise.all([createPosSale(sale), createPosSale(sale)]);
    expect(String(first._id)).toBe(String(retry._id));
    expect((await stock(product._id)).stock).toBe(9);
  });

  it("does not let one verified provider transaction pay two different orders", async () => {
    const first = await fixture();
    const second = await fixture();
    const firstOrder = await createOrder({ ...first.input, paymentMethod: "stripe" });
    const secondOrder = await createOrder({ ...second.input, paymentMethod: "stripe" });
    await settleOrderPayment(String(firstOrder._id), "stripe", "one-real-transaction");
    await expect(settleOrderPayment(String(secondOrder._id), "stripe", "one-real-transaction")).rejects.toThrow(/another order/);
    expect((await stock(second.product._id)).stock).toBe(10);
    expect((await Order.findById(secondOrder._id))!.paymentStatus).toBe("pending");
  });
});

describe("flash deal campaign pricing and allowance", () => {
  const dealWindow = () => ({ startsAt: new Date(Date.now() - 3_600_000), endsAt: new Date(Date.now() + 3_600_000) });

  async function campaign(product: unknown, overrides: Record<string, unknown> = {}, dealOverrides: Record<string, unknown> = {}) {
    return FlashDeal.create({
      title: "Campaign",
      slug: `campaign-${id()}`,
      ...dealWindow(),
      active: true,
      products: [{ productId: product, variantSku: "sku", discountType: "percent", discount: 50, dealStock: null, ...overrides }],
      ...dealOverrides,
    });
  }

  it("prices the line from the campaign instead of the product's own discount, and taxes the deal price", async () => {
    // Product discount 10% and tax 10%: without the campaign a unit costs 90 + 9 tax.
    const { product, input } = await fixture({ discount: 10, discountType: "percent", tax: 10, taxType: "percent" });
    await campaign(product._id); // 50% off, replaces the 10%

    const order = await createOrder(input);
    expect(order.details[0].items[0].unitPrice).toBe(50);
    expect(order.details[0].items[0].listPrice).toBe(100);
    expect(order.details[0].subtotal).toBe(100); // 2 units at 50
    expect(order.tax).toBe(10); // 10% of the discounted subtotal, not of 180
    expect(order.grandTotal).toBe(110);
  });

  it("applies a fixed-amount campaign discount like the legacy 'amount' type", async () => {
    const { product, input } = await fixture({ discount: 10, discountType: "percent" });
    await campaign(product._id, { discountType: "flat", discount: 30 });

    const order = await createOrder(input);
    expect(order.details[0].items[0].unitPrice).toBe(70);
  });

  it("ignores a campaign that has not started, has ended, or is inactive", async () => {
    const scheduled = await fixture({ discount: 10, discountType: "percent" });
    await campaign(scheduled.product._id, {}, { startsAt: new Date(Date.now() + 86_400_000), endsAt: new Date(Date.now() + 172_800_000) });
    expect((await createOrder(scheduled.input)).details[0].items[0].unitPrice).toBe(90);

    const ended = await fixture({ discount: 10, discountType: "percent" });
    await campaign(ended.product._id, {}, { startsAt: new Date(Date.now() - 172_800_000), endsAt: new Date(Date.now() - 86_400_000) });
    expect((await createOrder(ended.input)).details[0].items[0].unitPrice).toBe(90);

    const paused = await fixture({ discount: 10, discountType: "percent" });
    await campaign(paused.product._id, {}, { active: false });
    expect((await createOrder(paused.input)).details[0].items[0].unitPrice).toBe(90);
  });

  it("only discounts the variant the campaign names", async () => {
    const userId = id();
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Two variants", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }, { sku: "other", price: 100, stock: 10, reserved: 0 }] });
    await campaign(product._id);
    await Cart.create({ userId, items: [
      { productId: product._id, variantSku: "sku", quantity: 1 },
      { productId: product._id, variantSku: "other", quantity: 1 },
    ] });

    const order = await createOrder({ owner: { userId: String(userId) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    const prices = Object.fromEntries(order.details[0].items.map((item: { variantSku: string; unitPrice: number }) => [item.variantSku, item.unitPrice]));
    expect(prices).toEqual({ sku: 50, other: 100 });
  });

  it("consumes the campaign allowance and stops quoting the deal once it is spent", async () => {
    const first = await fixture({ discount: 0 });
    await campaign(first.product._id, { dealStock: 2 });

    const firstOrder = await createOrder(first.input); // 2 units, exactly the allowance
    expect(firstOrder.details[0].items[0].unitPrice).toBe(50);
    const deal = await FlashDeal.findOne({ "products.productId": first.product._id });
    expect(deal!.products[0]!.dealSold).toBe(2);

    // A second shopper on the same (sold-out) campaign line pays the normal price
    // rather than being quoted a deal the allowance can no longer cover.
    const secondUser = id();
    await Cart.create({ userId: secondUser, items: [{ productId: first.product._id, variantSku: "sku", quantity: 1 }] });
    const secondOrder = await createOrder({ owner: { userId: String(secondUser) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    expect(secondOrder.details[0].items[0].unitPrice).toBe(100);
    expect(secondOrder.details[0].items[0].flashDealId).toBeNull();
    expect((await FlashDeal.findById(deal!._id))!.products[0]!.dealSold).toBe(2);
  });

  it("does not oversell the allowance when two checkouts race for the last units", async () => {
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Scarce deal", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
    await campaign(product._id, { dealStock: 2 });

    const buyers = await Promise.all([id(), id()].map(async (userId) => {
      await Cart.create({ userId, items: [{ productId: product._id, variantSku: "sku", quantity: 2 }] });
      return { owner: { userId: String(userId) }, address, paymentMethod: "cod" as const, idempotencyKey: `checkout-${id()}` };
    }));
    const results = await Promise.allSettled(buyers.map((input) => createOrder(input)));

    const sold = (await FlashDeal.findOne({ "products.productId": product._id }))!.products[0]!.dealSold;
    expect(sold).toBe(2); // never 4
    const dealPriced = results.filter((result) =>
      result.status === "fulfilled" && result.value.details[0].items[0].unitPrice === 50);
    expect(dealPriced).toHaveLength(1);
  });

  it("returns the allowance when the order is cancelled", async () => {
    const { product, input } = await fixture({ discount: 0 });
    const deal = await campaign(product._id, { dealStock: 5 });
    const order = await createOrder(input);
    expect((await FlashDeal.findById(deal._id))!.products[0]!.dealSold).toBe(2);

    await cancelOrder(String(order._id), { id: String(input.owner.userId), role: "customer", permissions: [] } as never);
    expect((await FlashDeal.findById(deal._id))!.products[0]!.dealSold).toBe(0);
  });

  it("returns the allowance when a gateway payment fails, and not twice on a replay", async () => {
    const { product, input } = await fixture({ discount: 0 });
    const deal = await campaign(product._id, { dealStock: 5 });
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    expect((await FlashDeal.findById(deal._id))!.products[0]!.dealSold).toBe(2);

    await failOrderPayment(String(order._id), "stripe");
    await failOrderPayment(String(order._id), "stripe");
    expect((await FlashDeal.findById(deal._id))!.products[0]!.dealSold).toBe(0);
  });

  it("survives a campaign deleted after the order was placed", async () => {
    const { product, input } = await fixture({ discount: 0 });
    const deal = await campaign(product._id, { dealStock: 5 });
    const order = await createOrder(input);
    await FlashDeal.deleteOne({ _id: deal._id });

    await expect(cancelOrder(String(order._id), { id: String(input.owner.userId), role: "customer", permissions: [] } as never)).resolves.toBeTruthy();
    expect((await Order.findById(order._id))!.status).toBe("cancelled");
  });

  it("quotes the campaign price in the cart, matching what is charged", async () => {
    const userId = id();
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Carted deal", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 10, discountType: "percent",
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
    await campaign(product._id);
    await setCartItem({ userId: String(userId) }, String(product._id), "sku", 2);

    const cart = await getCartWithDetails({ userId: String(userId) });
    expect(cart.items[0]!.unitPrice).toBe(50);
    expect(cart.items[0]!.listPrice).toBe(100);
    expect(cart.subtotal).toBe(100);

    const order = await createOrder({ owner: { userId: String(userId) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    expect(order.details[0].subtotal).toBe(cart.subtotal);
  });

  it("prices a POS till line from the live campaign too", async () => {
    const { product } = await fixture({ discount: 0 });
    await campaign(product._id, { dealStock: 3 });

    const sale = await createPosSale({ sellerId: null, operatorId: String(id()), allowAnySeller: true,
      walkIn: { name: "Walk in", phone: "9000000000" },
      lines: [{ productId: String(product._id), variantSku: "sku", quantity: 1 }], paymentType: "cash", idempotencyKey: `pos-${id()}` });

    expect(sale.details[0].items[0].unitPrice).toBe(50);
    expect((await FlashDeal.findOne({ "products.productId": product._id }))!.products[0]!.dealSold).toBe(1);
  });
});

describe("seller and customer package purchases", () => {
  async function sellerWithShop(balance = 1000) {
    const seller = await User.create({ name: "Seller", email: `seller-${id()}@example.com`, passwordHash: "x", role: "seller" });
    await Shop.create({ sellerId: seller._id, name: `Shop ${id()}`, slug: `shop-${id()}` });
    if (balance > 0) await Wallet.create({ userId: seller._id, currency: "INR", balance });
    return seller;
  }

  async function plan(overrides: Record<string, unknown> = {}) {
    return SellerPackage.create({ name: "Plan", price: 100, durationDays: 30, productLimit: 5, digitalProductLimit: 2, ...overrides });
  }

  beforeEach(async () => {
    await Addon.create({ key: "seller_subscription", name: "Seller subscription", enabled: true });
  });

  it("debits the wallet, records the payment and grants the allowance in one transaction", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan();

    const payment = await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    expect(payment.status).toBe("paid");
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(900);
    const shop = await Shop.findOne({ sellerId: seller._id });
    expect(shop!.remainingUploads).toBe(5);
    expect(shop!.remainingDigitalUploads).toBe(2);
    expect(shop!.packageInvalidAt!.getTime()).toBeGreaterThan(Date.now());
    expect(String(shop!.sellerPackageId)).toBe(String(pkg._id));
  });

  it("charges once for a replayed purchase key, and refuses another account's key", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan();
    const key = `buy-${id()}`;

    const [first, second] = await Promise.all([
      purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: key }),
      purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: key }),
    ]);

    expect(String(first._id)).toBe(String(second._id));
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(900);
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(5);
    expect(await SellerPackagePayment.countDocuments({ sellerId: seller._id })).toBe(1);

    const other = await sellerWithShop();
    await expect(purchaseSellerPackage({ userId: String(other._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: key }))
      .rejects.toThrow(/already in use/);
  });

  it("adds a renewal's uploads to what is left and recomputes the expiry from the purchase", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan();
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });
    await consumeSellerUpload(String(seller._id), "product");
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    const shop = await Shop.findOne({ sellerId: seller._id });
    expect(shop!.remainingUploads).toBe(9); // 5 - 1 + 5
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(800);
  });

  it("refuses a purchase the wallet cannot cover, and grants nothing", async () => {
    const seller = await sellerWithShop(50);
    const pkg = await plan({ price: 100 });

    await expect(purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` }))
      .rejects.toThrow(/Insufficient/);
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(50);
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(0);
    expect(await SellerPackagePayment.countDocuments({ sellerId: seller._id })).toBe(0);
  });

  it("lets a free plan be taken once but not re-taken while it is the current plan", async () => {
    const seller = await sellerWithShop(0);
    const free = await plan({ price: 0 });

    const payment = await purchaseSellerPackage({ userId: String(seller._id), packageId: String(free._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });
    expect(payment.status).toBe("paid");
    await expect(purchaseSellerPackage({ userId: String(seller._id), packageId: String(free._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` }))
      .rejects.toThrow(/cannot purchase this package anymore/);
  });

  it("grants nothing for an offline purchase until an admin approves it", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan();
    const payment = await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "manual", idempotencyKey: `buy-${id()}` });

    expect(payment.status).toBe("pending");
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(0);
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(1000); // nothing taken

    const admin = await User.create({ name: "Admin", email: `admin-${id()}@example.com`, passwordHash: "x", role: "admin" });
    const token = await testAccessToken({ sub: String(admin._id), role: "admin" });
    const approve = () => fetch(`${base}/api/v1/addons/admin/packages/seller/payments/${payment._id}/approve`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ approve: true }),
    });
    const [one, two] = await Promise.all([approve(), approve()]);
    expect([one.status, two.status].sort()).toEqual([200, 409]);
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(5); // granted exactly once
  });

  it("consumes one upload per listing, by kind, and refuses once the allowance is spent", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan({ productLimit: 1, digitalProductLimit: 1 });
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    await consumeSellerUpload(String(seller._id), "product");
    await consumeSellerUpload(String(seller._id), "digital");
    await expect(consumeSellerUpload(String(seller._id), "product")).rejects.toThrow(/upload limit/);
    await expect(consumeSellerUpload(String(seller._id), "digital")).rejects.toThrow(/digital upload limit/);
  });

  it("does not let concurrent uploads spend the same last allowance", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan({ productLimit: 1 });
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    const results = await Promise.allSettled([
      consumeSellerUpload(String(seller._id), "product"),
      consumeSellerUpload(String(seller._id), "product"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(0);
  });

  it("gives the upload back when the listing it was taken for is not created", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan({ productLimit: 2 });
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    const release = await consumeSellerUpload(String(seller._id), "product");
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(1);
    await release();
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(2);
  });

  it("refuses uploads and publishing once the subscription has lapsed, and unpublishes the catalogue", async () => {
    const seller = await sellerWithShop();
    const pkg = await plan();
    await purchaseSellerPackage({ userId: String(seller._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: `buy-${id()}` });

    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    await Product.create({ name: "Listed", slug: `product-${id()}`, addedBy: "seller", sellerId: seller._id,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved",
      variants: [{ sku: "sku", price: 100, stock: 1, reserved: 0 }] });

    // Backdate the expiry, as the passage of time would.
    await Shop.updateOne({ sellerId: seller._id }, { packageInvalidAt: new Date(Date.now() - 86_400_000) });

    await expect(consumeSellerUpload(String(seller._id), "product")).rejects.toThrow(/expired/);
    await expect(assertSellerPackageValid(String(seller._id))).rejects.toThrow(/expired/);

    expect(await unpublishExpiredSellerProducts()).toEqual({ sellers: 1, unpublished: 1 });
    expect(await Product.countDocuments({ sellerId: seller._id, published: true })).toBe(0);
    // A second sweep finds nothing left to change.
    expect((await unpublishExpiredSellerProducts()).unpublished).toBe(0);
  });

  it("leaves uploads unlimited while the subscription add-on is switched off", async () => {
    await Addon.updateOne({ key: "seller_subscription" }, { enabled: false });
    const seller = await sellerWithShop();
    const release = await consumeSellerUpload(String(seller._id), "product");
    await release();
    expect((await Shop.findOne({ sellerId: seller._id }))!.remainingUploads).toBe(0);
  });

  it("grants a customer classified allowance once and consumes it per listing", async () => {
    await Addon.create({ key: "classified_products", name: "Classified products", enabled: true });
    const user = await User.create({ name: "Customer", email: `cust-${id()}@example.com`, passwordHash: "x", role: "customer" });
    await Wallet.create({ userId: user._id, currency: "INR", balance: 500 });
    const pkg = await CustomerPackage.create({ name: "Listings", price: 100, durationDays: 30, classifiedListingLimit: 1 });

    const key = `cbuy-${id()}`;
    await purchaseCustomerPackage({ userId: String(user._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: key });
    await purchaseCustomerPackage({ userId: String(user._id), packageId: String(pkg._id), paymentMethod: "wallet", idempotencyKey: key });
    expect((await Wallet.findOne({ userId: user._id }))!.balance).toBe(400);
    expect((await User.findById(user._id))!.remainingUploads).toBe(1);

    await consumeCustomerUpload(String(user._id));
    await expect(consumeCustomerUpload(String(user._id))).rejects.toThrow(/upload limit/);
  });
});

describe("abandoned checkouts and late captures", () => {
  async function age(orderId: unknown, minutes: number) {
    // Mongoose marks `createdAt` immutable, so the native collection is used to
    // age the row the way the passage of time would.
    await Order.collection.updateOne({ _id: orderId as never }, { $set: { createdAt: new Date(Date.now() - minutes * 60_000) } });
  }

  it("releases stock, campaign allowance, points and coupon use from an abandoned gateway checkout", async () => {
    const { product, input, userId } = await fixture({ discount: 0 });
    const deal = await FlashDeal.create({
      title: "Campaign", slug: `campaign-${id()}`, active: true,
      startsAt: new Date(Date.now() - 3_600_000), endsAt: new Date(Date.now() + 3_600_000),
      products: [{ productId: product._id, variantSku: "sku", discountType: "percent", discount: 50, dealStock: 5 }],
    });
    const coupon = await Coupon.create({ code: `ABANDON${id()}`, type: "percent", value: 10, active: true });
    await ClubPointConfig.create({ pointsPerCurrency: 1, currencyPerPoint: 1 });
    await User.updateOne({ _id: userId }, { clubPoints: 10 }, { upsert: true });

    const order = await createOrder({ ...input, paymentMethod: "stripe", couponCode: coupon.code });
    expect((await stock(product._id)).reserved).toBe(2);
    expect(await CouponUsage.countDocuments({ orderId: order._id })).toBe(1);

    // Too young to sweep.
    expect((await expireAbandonedOrders(60)).expired).toBe(0);
    expect((await stock(product._id)).reserved).toBe(2);

    await age(order._id, 120);
    const result = await expireAbandonedOrders(60);
    expect(result.expired).toBe(1);

    const swept = await Order.findById(order._id);
    expect(swept!.status).toBe("cancelled");
    expect(swept!.paymentStatus).toBe("failed");
    expect(swept!.inventoryStatus).toBe("released");
    const variant = await stock(product._id);
    expect(variant.reserved).toBe(0);
    expect(variant.stock).toBe(10); // never consumed
    expect((await FlashDeal.findById(deal._id))!.products[0]!.dealSold).toBe(0);
    expect(await CouponUsage.countDocuments({ orderId: order._id })).toBe(0);

    // Idempotent: a second sweep finds nothing and does not double-release.
    expect((await expireAbandonedOrders(60)).expired).toBe(0);
    expect((await stock(product._id)).reserved).toBe(0);
  });

  it("leaves COD, wallet and already-paid orders alone", async () => {
    const cod = await fixture();
    const codOrder = await createOrder(cod.input);
    await age(codOrder._id, 600);

    const paid = await fixture();
    const paidOrder = await createOrder({ ...paid.input, paymentMethod: "stripe" });
    await settleOrderPayment(String(paidOrder._id), "stripe", `txn-${id()}`);
    await age(paidOrder._id, 600);

    expect((await expireAbandonedOrders(60)).expired).toBe(0);
    expect((await Order.findById(codOrder._id))!.status).toBe("confirmed");
    expect((await Order.findById(paidOrder._id))!.paymentStatus).toBe("paid");
  });

  it("records a capture that arrives after the checkout was swept, for refund, and does not fulfil it", async () => {
    const { product, input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    await age(order._id, 120);
    await expireAbandonedOrders(60);

    const ref = `late-${id()}`;
    await expect(settleOrderPayment(String(order._id), "stripe", ref)).rejects.toThrow(/closed before the payment settled/);

    const captures = await listLateCaptures();
    expect(captures).toHaveLength(1);
    expect(captures[0]!.requiresRefund).toBe(true);
    expect(captures[0]!.amount).toBe((await Order.findById(order._id))!.grandTotal);

    // Nothing was fulfilled: the order stays closed and the stock stays on sale.
    const closed = await Order.findById(order._id);
    expect(closed!.paymentStatus).toBe("failed");
    expect((await stock(product._id)).stock).toBe(10);

    // The same provider transaction cannot then be used to pay a different order.
    const other = await fixture();
    const otherOrder = await createOrder({ ...other.input, paymentMethod: "stripe" });
    await expect(settleOrderPayment(String(otherOrder._id), "stripe", ref)).rejects.toThrow(/another order/);

    // A replayed late notification records one capture, not two.
    await expect(settleOrderPayment(String(order._id), "stripe", ref)).rejects.toThrow(/closed before the payment settled/);
    expect(await listLateCaptures()).toHaveLength(1);
  });

  it("does not sweep a checkout that settles while the sweep is deciding", async () => {
    const { product, input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    await age(order._id, 120);

    const [sweep, settle] = await Promise.allSettled([
      expireAbandonedOrders(60),
      settleOrderPayment(String(order._id), "stripe", `race-${id()}`),
    ]);

    const settled = await Order.findById(order._id);
    // Whichever of the two won, the order is never both paid and released, and the
    // money is never silently dropped.
    if (settled!.paymentStatus === "paid") {
      expect(settle.status).toBe("fulfilled");
      expect(settled!.inventoryStatus).toBe("confirmed");
      expect((await stock(product._id)).stock).toBe(8);
      expect(sweep.status === "fulfilled" && sweep.value.expired).toBe(0);
      expect(await listLateCaptures()).toHaveLength(0);
    } else {
      expect(settled!.inventoryStatus).toBe("released");
      expect((await stock(product._id)).stock).toBe(10);
      // The sweep got there first, so the capture is held for refund.
      expect(settle.status).toBe("rejected");
      expect(await listLateCaptures()).toHaveLength(1);
    }
  });
});

describe("background maintenance", () => {
  it("runs each sweep once per interval even when two instances tick together", async () => {
    const { product, input } = await fixture();
    const order = await createOrder({ ...input, paymentMethod: "stripe" });
    await Order.collection.updateOne({ _id: order._id as never }, { $set: { createdAt: new Date(Date.now() - 7_200_000) } });

    // Two instances, one interval: the lock means one of them does the work.
    const [first, second] = await Promise.all([
      runMaintenanceOnce({ reservationTtlMinutes: 60 }),
      runMaintenanceOnce({ reservationTtlMinutes: 60 }),
    ]);
    const didWork = [first, second].filter((result) => result.abandoned !== null);
    expect(didWork).toHaveLength(1);
    expect(didWork[0]!.abandoned!.expired).toBe(1);

    expect((await Order.findById(order._id))!.status).toBe("cancelled");
    expect((await stock(product._id)).reserved).toBe(0);
  });

  it("releases its lock after a run so the next interval can work again", async () => {
    await runMaintenanceOnce();
    const lock = await JobLock.findById("expire-abandoned-orders");
    expect(lock!.lastRunAt).toBeTruthy();
    expect(lock!.lockedUntil.getTime()).toBeLessThanOrEqual(Date.now());

    // A second run is admitted (and finds nothing to do).
    const again = await runMaintenanceOnce();
    expect(again.abandoned).not.toBeNull();
    expect(again.abandoned!.expired).toBe(0);
  });

  it("releases its lock when the work throws, so a failure is not a permanent stall", async () => {
    await expect(withJobLock("boom", 15, async () => { throw new Error("sweep failed"); })).rejects.toThrow(/sweep failed/);
    const lock = await JobLock.findById("boom");
    expect(lock!.lockedUntil.getTime()).toBeLessThanOrEqual(Date.now());
    await expect(withJobLock("boom", 15, async () => "second attempt")).resolves.toBe("second attempt");
  });

  it("does not admit a second run while a lease is held", async () => {
    // Hold the lease, then try to claim it.
    const held = withJobLock("slow", 15, async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return "done";
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await withJobLock("slow", 15, async () => "other")).toBeNull();
    expect(await held).toBe("done");
  });
});

describe("package purchases paid through a gateway", () => {
  async function sellerWithShop() {
    const seller = await User.create({ name: "Seller", email: `gw-seller-${id()}@example.com`, passwordHash: "x", role: "seller" });
    await Shop.create({ sellerId: seller._id, name: `Shop ${id()}`, slug: `shop-${id()}` });
    return seller;
  }

  async function intentFor(userId: unknown, packageId: unknown, purpose: "seller_package" | "customer_package", amount = 100) {
    const intent = await GatewayIntent.create({
      purpose, userId, refId: packageId, code: `PAY-${id()}`, grandTotal: amount,
      currency: "INR", paymentMethod: "stripe", paymentStatus: "pending",
    });
    await Payment.create({
      intentId: intent._id, method: "stripe", amount, currency: "INR",
      status: "pending", idempotencyKey: `intent:${intent._id}:stripe`,
    });
    return intent;
  }

  it("grants the plan the seller paid the gateway for, exactly once", async () => {
    await Addon.create({ key: "seller_subscription", name: "Seller subscription", enabled: true });
    const seller = await sellerWithShop();
    const pkg = await SellerPackage.create({ name: "Gateway plan", price: 100, durationDays: 30, productLimit: 7, digitalProductLimit: 3 });
    const intent = await intentFor(seller._id, pkg._id, "seller_package");

    await settleOrderPayment(String(intent._id), "stripe", `gw-${id()}`);
    // A replayed callback must not grant a second allowance.
    await settleOrderPayment(String(intent._id), "stripe", `gw-${id()}`);

    const shop = await Shop.findOne({ sellerId: seller._id });
    expect(shop!.remainingUploads).toBe(7);
    expect(shop!.remainingDigitalUploads).toBe(3);
    expect(String(shop!.sellerPackageId)).toBe(String(pkg._id));
    expect(shop!.packageInvalidAt!.getTime()).toBeGreaterThan(Date.now());
    expect(await SellerPackagePayment.countDocuments({ sellerId: seller._id })).toBe(1);
    expect((await SellerPackagePayment.findOne({ sellerId: seller._id }))!.status).toBe("paid");
  });

  it("grants a customer listing allowance paid through a gateway", async () => {
    const user = await User.create({ name: "Customer", email: `gw-cust-${id()}@example.com`, passwordHash: "x", role: "customer" });
    const pkg = await CustomerPackage.create({ name: "Listings", price: 50, durationDays: 365, classifiedListingLimit: 4 });
    const intent = await intentFor(user._id, pkg._id, "customer_package", 50);

    await settleOrderPayment(String(intent._id), "stripe", `gw-${id()}`);

    const after = await User.findById(user._id);
    expect(after!.remainingUploads).toBe(4);
    expect(String(after!.customerPackageId)).toBe(String(pkg._id));
  });

  it("flags a seller plan paid for by an account with no shop instead of swallowing the payment", async () => {
    const seller = await User.create({ name: "Shopless", email: `gw-none-${id()}@example.com`, passwordHash: "x", role: "seller" });
    const pkg = await SellerPackage.create({ name: "Gateway plan", price: 100, durationDays: 30, productLimit: 7 });
    const intent = await intentFor(seller._id, pkg._id, "seller_package");

    await settleOrderPayment(String(intent._id), "stripe", `gw-${id()}`);

    // The money was captured, so the settlement stands - but it is flagged for an
    // operator rather than reported as a delivered plan.
    const flagged = await Payment.findOne({ intentId: intent._id });
    expect(flagged!.status).toBe("paid");
    expect(flagged!.requiresRefund).toBe(true);
    expect(await listLateCaptures()).toHaveLength(1);
  });

  it("refuses to start a gateway payment that could not be delivered", async () => {
    await Addon.create({ key: "seller_subscription", name: "Seller subscription", enabled: true });
    const shopless = await User.create({ name: "Shopless", email: `gw-pre-${id()}@example.com`, passwordHash: "x", role: "seller" });
    const paid = await SellerPackage.create({ name: "Paid", price: 100, durationDays: 30, productLimit: 5 });
    const free = await SellerPackage.create({ name: "Free", price: 0, durationDays: 30, productLimit: 5 });

    const post = (token: string, body: unknown) =>
      fetch(`${base}/api/v1/payments/intents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    const shoplessToken = await testAccessToken({ sub: String(shopless._id), role: "seller" });
    const noShop = await post(shoplessToken, { purpose: "seller_package", packageId: String(paid._id), paymentMethod: "stripe" });
    expect(noShop.status).toBe(400);
    expect((await noShop.json() as { message: string }).message).toMatch(/shop/i);

    const seller = await sellerWithShop();
    const token = await testAccessToken({ sub: String(seller._id), role: "seller" });
    // A free plan is activated directly; no provider accepts a zero-amount session.
    const zero = await post(token, { purpose: "seller_package", packageId: String(free._id), paymentMethod: "stripe" });
    expect(zero.status).toBe(400);

    const ok = await post(token, { purpose: "seller_package", packageId: String(paid._id), paymentMethod: "stripe" });
    expect(ok.status).toBe(201);
    expect((await ok.json() as { grandTotal: number }).grandTotal).toBe(100);

    // A customer may not buy a seller plan.
    const customer = await User.create({ name: "Customer", email: `gw-c-${id()}@example.com`, passwordHash: "x", role: "customer" });
    const customerToken = await testAccessToken({ sub: String(customer._id), role: "customer" });
    const wrongRole = await post(customerToken, { purpose: "seller_package", packageId: String(paid._id), paymentMethod: "stripe" });
    expect([401, 403]).toContain(wrongRole.status);
  });
});

describe("affiliate earnings", () => {
  async function program(config: Record<string, unknown>) {
    await Addon.create({ key: "affiliate", name: "Affiliate", enabled: true });
    return AffiliateConfig.create({ enabled: true, commissionPercent: 0, cookieDays: 0, ...config });
  }

  async function affiliate(code: string) {
    const user = await User.create({ name: "Sharer", email: `aff-${id()}@example.com`, passwordHash: "x", role: "customer" });
    const row = await AffiliateUser.create({ userId: user._id, referralCode: code, status: "approved" });
    return { user, affiliateUser: row };
  }

  it("pays a share commission to the affiliate whose link brought the line in", async () => {
    await program({ productSharing: { enabled: true, commissionType: "percent", commission: 10 } });
    const { affiliateUser } = await affiliate(`SHARE${id()}`);
    const code = affiliateUser.referralCode;

    const userId = id();
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Shared", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
    await Cart.create({ userId, items: [{ productId: product._id, variantSku: "sku", quantity: 2, productReferralCode: code }] });

    const order = await createOrder({ owner: { userId: String(userId) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    // The code travels from the cart line onto the order line.
    expect(order.details[0].items[0].productReferralCode).toBe(code);

    await settleOrderPayment(String(order._id), "cod");

    const earnings = await AffiliateEarningDetail.find({ affiliateUserId: affiliateUser._id });
    expect(earnings).toHaveLength(1);
    expect(earnings[0]!.kind).toBe("product_share");
    expect(earnings[0]!.amount).toBe(20); // 10% of 2 x 100
    expect((await AffiliateUser.findById(affiliateUser._id))!.availableBalance).toBe(20);

    // A redelivered settlement does not pay it twice.
    await settleOrderPayment(String(order._id), "cod");
    expect(await AffiliateEarningDetail.countDocuments({ affiliateUserId: affiliateUser._id })).toBe(1);
  });

  it("caps a fixed share commission at the line value and ignores a self-purchase", async () => {
    await program({ productSharing: { enabled: true, commissionType: "amount", commission: 500 } });
    const { user: sharer, affiliateUser } = await affiliate(`SELF${id()}`);
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Shared", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });

    // The sharer buying through their own link earns nothing.
    await Cart.create({ userId: sharer._id, items: [{ productId: product._id, variantSku: "sku", quantity: 1, productReferralCode: affiliateUser.referralCode }] });
    const own = await createOrder({ owner: { userId: String(sharer._id) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    await settleOrderPayment(String(own._id), "cod");
    expect(await AffiliateEarningDetail.countDocuments({ affiliateUserId: affiliateUser._id })).toBe(0);

    // Someone else's purchase pays, but never more than the line is worth.
    const buyer = id();
    await Cart.create({ userId: buyer, items: [{ productId: product._id, variantSku: "sku", quantity: 1, productReferralCode: affiliateUser.referralCode }] });
    const order = await createOrder({ owner: { userId: String(buyer) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    await settleOrderPayment(String(order._id), "cod");

    const earning = await AffiliateEarningDetail.findOne({ affiliateUserId: affiliateUser._id });
    expect(earning!.amount).toBe(100); // capped from 500 to the 100 line
  });

  it("pays the first-purchase bonus once, and not on later orders", async () => {
    await program({ firstPurchase: { enabled: true, percent: 10 } });
    const { user: referrer, affiliateUser } = await affiliate(`FIRST${id()}`);

    const buyer = await User.create({ name: "Buyer", email: `buyer-${id()}@example.com`, passwordHash: "x", role: "customer", referredBy: referrer._id });
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Thing", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 50, reserved: 0 }] });

    const buy = async () => {
      await Cart.create({ userId: buyer._id, items: [{ productId: product._id, variantSku: "sku", quantity: 1 }] });
      const order = await createOrder({ owner: { userId: String(buyer._id) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
      await settleOrderPayment(String(order._id), "cod");
      return order;
    };

    const first = await buy();
    const bonus = await AffiliateEarningDetail.find({ affiliateUserId: affiliateUser._id });
    expect(bonus).toHaveLength(1);
    expect(bonus[0]!.kind).toBe("first_purchase");
    expect(bonus[0]!.amount).toBe(Math.round(first.grandTotal * 10) / 100);

    await buy();
    expect(await AffiliateEarningDetail.countDocuments({ affiliateUserId: affiliateUser._id })).toBe(1);
  });

  it("reverses every commission on wallet cancellation without allowing paid cash cancellation", async () => {
    await program({
      firstPurchase: { enabled: true, percent: 10 },
      productSharing: { enabled: true, commissionType: "percent", commission: 10 },
    });
    const { user: referrer, affiliateUser: referrerAffiliate } = await affiliate(`REF${id()}`);
    const { affiliateUser: sharer } = await affiliate(`SHR${id()}`);

    const buyer = await User.create({ name: "Buyer", email: `buyer-${id()}@example.com`, passwordHash: "x", role: "customer", referredBy: referrer._id });
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Thing", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
    await Cart.create({ userId: buyer._id, items: [{ productId: product._id, variantSku: "sku", quantity: 1, productReferralCode: sharer.referralCode }] });

    await Wallet.create({ userId: buyer._id, currency: "INR", balance: 1000 });
    const order = await createOrder({ owner: { userId: String(buyer._id) }, address, paymentMethod: "wallet", idempotencyKey: `checkout-${id()}` });

    // Both commissions were paid: the share and the first-purchase bonus.
    expect(await AffiliateEarningDetail.countDocuments({ orderId: order._id, status: "credited" })).toBe(2);
    expect((await AffiliateUser.findById(sharer._id))!.availableBalance).toBe(10);
    expect((await AffiliateUser.findById(referrerAffiliate._id))!.availableBalance).toBeGreaterThan(0);

    await cancelOrder(String(order._id), { id: String(buyer._id), role: "customer", permissions: [] } as never);

    expect(await AffiliateEarningDetail.countDocuments({ orderId: order._id, status: "credited" })).toBe(0);
    expect(await AffiliateEarningDetail.countDocuments({ orderId: order._id, status: "reversed" })).toBe(2);
    expect((await AffiliateUser.findById(sharer._id))!.availableBalance).toBe(0);
    expect((await AffiliateUser.findById(referrerAffiliate._id))!.availableBalance).toBe(0);
  });

  it("pays nothing while the affiliate add-on or the program is switched off", async () => {
    await Addon.create({ key: "affiliate", name: "Affiliate", enabled: false });
    await AffiliateConfig.create({ enabled: true, productSharing: { enabled: true, commissionType: "percent", commission: 10 } });
    const { affiliateUser } = await affiliate(`OFF${id()}`);

    const userId = id();
    const category = await Category.create({ name: "Category", slug: `cat-${id()}`, level: 0 });
    const product = await Product.create({ name: "Shared", slug: `product-${id()}`, addedBy: "admin", sellerId: null,
      categoryId: category._id, basePrice: 100, published: true, approvalStatus: "approved", discount: 0,
      variants: [{ sku: "sku", price: 100, stock: 10, reserved: 0 }] });
    await Cart.create({ userId, items: [{ productId: product._id, variantSku: "sku", quantity: 1, productReferralCode: affiliateUser.referralCode }] });

    const order = await createOrder({ owner: { userId: String(userId) }, address, paymentMethod: "cod", idempotencyKey: `checkout-${id()}` });
    await settleOrderPayment(String(order._id), "cod");
    expect(await AffiliateEarningDetail.countDocuments()).toBe(0);
  });
});
