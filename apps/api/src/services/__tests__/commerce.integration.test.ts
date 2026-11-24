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
import { settleOrderPayment, failOrderPayment, recordPaymentEventOnce, completePaymentEvent } from "../payment.service.js";
import { createPosSale } from "../pos.service.js";
import { Product } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { Cart } from "../../models/Cart.js";
import { Order } from "../../models/Order.js";
import { Coupon, CouponUsage } from "../../models/Coupon.js";
import { BusinessSetting, GeneralSetting, Addon } from "../../models/Settings.js";
import { SellerLedger } from "../../models/Ledger.js";
import { Wallet, WalletTransaction } from "../../models/Wallet.js";
import { User } from "../../models/User.js";
import { ClubPointConfig } from "../../models/ClubPoints.js";
import { mergeGuestCartIntoUser, setCartItem } from "../cart.service.js";
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
import { assertVerifiedPayment } from "../gateways/shared.js";

let repl: MongoMemoryReplSet;
let server: Server;
let base: string;
const id = () => new mongoose.Types.ObjectId();
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
      const token = signAccessToken({ sub: String(id()), role, permissions: [] });
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
    const token = signAccessToken({ sub: String(id()), role: "admin" });
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
    const sellerToken = signAccessToken({ sub: String(seller), role: "seller" });
    const response = await fetch(`${base}/api/v1/orders/${order._id}`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    const body = await response.json() as { details: unknown[]; idempotencyKey?: string; grandTotal: number };
    expect(response.status).toBe(200);
    expect(body.details).toHaveLength(1);
    expect(body.idempotencyKey).toBeUndefined();
    expect(body.grandTotal).toBe(200);
    const staffToken = signAccessToken({ sub: String(id()), role: "staff", permissions: [] });
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
    const token = signAccessToken({ sub: String(userId), role: "customer" });
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
    const token = signAccessToken({ sub: String(userId), role: "customer" });
    const response = await fetch(`${base}/api/v1/addons/refunds`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: String(order._id), sellerId: "null", reason: "Return" }),
    });
    expect(response.status).toBe(201);
    const refund = await response.json() as { id: string; amount: number };
    expect(refund.amount).toBe(100);
    const admin = signAccessToken({ sub: String(id()), role: "admin" });
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
    const admin = signAccessToken({ sub: String(id()), role: "admin" });
    const pay = (key: string) => fetch(`${base}/api/v1/admin/sellers/${seller._id}/payouts`, {
      method: "POST", headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 80, method: "wallet", idempotencyKey: key }),
    });
    const responses = await Promise.all([pay("payout-attempt-one"), pay("payout-attempt-two")]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect((await Wallet.findOne({ userId: seller._id }))!.balance).toBe(80);
    const token = signAccessToken({ sub: String(seller._id), role: "seller" });
    const summary = await (await fetch(`${base}/api/v1/seller/ledger/summary`, { headers: { Authorization: `Bearer ${token}` } })).json() as { available: number };
    expect(summary.available).toBe(20);
  });

  it("reserves withdrawal requests and does not subtract a paid withdrawal twice", async () => {
    const seller = await User.create({ name: "Seller", email: "withdraw@example.test", passwordHash: "unused", role: "seller" });
    await SellerLedger.create({ sellerId: seller._id, type: "sale", amount: 100 });
    const token = signAccessToken({ sub: String(seller._id), role: "seller" });
    const request = () => fetch(`${base}/api/v1/seller/withdrawals`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: 80, method: "wallet" }),
    });
    const responses = await Promise.all([request(), request()]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    const approved = responses.find((response) => response.status === 201)!;
    const withdrawal = await approved.json() as { id: string };
    const admin = signAccessToken({ sub: String(id()), role: "admin" });
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
