import "server-only";

import crypto from "node:crypto";
import mongoose, { type ClientSession, type Types } from "mongoose";
import { z } from "zod";
import { connectMongo, isMongoDuplicate, objectId } from "@/lib/mongodb";
import {
  CartModel,
  CategoryModel,
  CouponModel,
  CouponUsageModel,
  OrderModel,
  ProductModel,
  SellerLedgerModel,
  SettingModel,
  ShopModel,
  User,
  WalletTransactionModel,
} from "@/models";

export const checkoutLineSchema = z.object({
  productId: z.string().min(1).max(80),
  quantity: z.coerce.number().int().positive().max(100),
  variation: z.string().trim().max(200).optional(),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  address: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().max(120).optional(),
  postal_code: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  payment: z.enum(["cod", "wallet"]),
  couponCode: z.string().trim().max(80).optional(),
  idempotencyKey: z.uuid(),
  lines: z.array(checkoutLineSchema).min(1).max(100),
  notes: z.string().trim().max(2000).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "CheckoutError";
  }
}

type OrderItem = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  seller: Types.ObjectId;
  sellerRole: string;
  name: string;
  slug?: string;
  image?: string;
  variation?: string;
  unitPrice: number;
  tax: number;
  shipping: number;
  quantity: number;
  total: number;
  commissionRate: number;
  commission: number;
  sellerEarning: number;
  paymentStatus: "paid" | "unpaid";
  deliveryStatus: "pending";
};

type PreparedOrder = {
  orderId: Types.ObjectId;
  code: string;
  products: any[];
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  coupon?: any;
  customerId?: Types.ObjectId;
  input: CheckoutInput;
};

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function enabled(value: unknown): boolean {
  return value === true || String(value) === "1";
}

function discountedPrice(price: number, discount: number, type: string): number {
  return round(Math.max(0, type === "percent" ? price * (1 - Math.min(discount, 100) / 100) : price - discount));
}

function makeCode(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${date}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function variantFor(product: any, requested?: string): any | null {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return null;
  if (!requested) throw new CheckoutError(`Choose an available option for ${product.name}.`, 409);
  const normalized = requested.trim().toLowerCase();
  const variant = variants.find((candidate: any) => String(candidate?.name || candidate?.variant || "").trim().toLowerCase() === normalized);
  if (!variant) throw new CheckoutError(`The selected option for ${product.name} is no longer available.`, 409);
  return variant;
}

async function settingsMap(): Promise<Record<string, unknown>> {
  const keys = [
    "business.cash_payment", "business.wallet_system", "business.coupon_system",
    "business.shipping_type", "business.flat_rate_shipping_cost", "business.shipping_cost_admin",
    "business.vendor_commission", "business.category_wise_commission",
  ];
  return Object.fromEntries((await SettingModel.find({ key: { $in: keys } }).select("key value").lean()).map((setting) => [setting.key, setting.value]));
}

async function prepareOrder(input: CheckoutInput, customerId?: Types.ObjectId): Promise<PreparedOrder> {
  const settings = await settingsMap();
  if (input.payment === "cod" && !enabled(settings["business.cash_payment"])) throw new CheckoutError("Cash on delivery is currently unavailable.", 409);
  if (input.payment === "wallet" && !enabled(settings["business.wallet_system"])) throw new CheckoutError("Wallet payments are currently unavailable.", 409);
  if (input.payment === "wallet" && !customerId) throw new CheckoutError("Sign in before paying with your wallet.", 401);
  if (input.couponCode && !enabled(settings["business.coupon_system"])) throw new CheckoutError("Coupons are currently disabled.", 409);

  const keyedLines = new Map<string, { productId: Types.ObjectId; quantity: number; variation?: string }>();
  for (const line of input.lines) {
    const productId = objectId(line.productId);
    if (!productId) throw new CheckoutError("Your cart contains an invalid product.");
    const key = `${productId}:${(line.variation || "").trim().toLowerCase()}`;
    const current = keyedLines.get(key);
    const quantity = (current?.quantity || 0) + line.quantity;
    if (quantity > 100) throw new CheckoutError("A cart line cannot exceed 100 units.", 409);
    keyedLines.set(key, { productId, quantity, variation: line.variation || current?.variation });
  }

  const productIds = [...new Set([...keyedLines.values()].map((line) => String(line.productId)))].map((id) => new mongoose.Types.ObjectId(id));
  const products = await ProductModel.find({ _id: { $in: productIds }, published: true }).lean();
  if (products.length !== productIds.length) throw new CheckoutError("One or more products are no longer available.", 409);
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const sellerIds = [...new Set(products.map((product) => String(product.seller)))].map((id) => new mongoose.Types.ObjectId(id));
  const [sellers, categories, shops] = await Promise.all([
    User.find({ _id: { $in: sellerIds }, status: "active" }).select("role").lean(),
    CategoryModel.find({ _id: { $in: products.map((product) => product.category) } }).select("commissionRate").lean(),
    ShopModel.find({ owner: { $in: sellerIds }, active: true }).select("owner shippingCost").lean(),
  ]);
  const roleBySeller = new Map(sellers.map((seller) => [String(seller._id), seller.role]));
  const rateByCategory = new Map(categories.map((category) => [String(category._id), Number(category.commissionRate || 0)]));
  const shopBySeller = new Map(shops.map((shop) => [String(shop.owner), shop]));
  const globalRate = Math.min(100, Math.max(0, Number(settings["business.vendor_commission"] || 0)));
  const categoryWise = enabled(settings["business.category_wise_commission"]);

  const items: OrderItem[] = [];
  for (const line of keyedLines.values()) {
    const product: any = productById.get(String(line.productId));
    if (!product) throw new CheckoutError("A cart product is unavailable.", 409);
    if (line.quantity < Number(product.minQuantity || 1)) throw new CheckoutError(`${product.name} requires a minimum quantity of ${product.minQuantity}.`, 409);
    const variant = variantFor(product, line.variation);
    const available = variant ? Number(variant.stock ?? variant.qty ?? 0) : Number(product.stock || 0);
    if (line.quantity > available) throw new CheckoutError(`${product.name} only has ${available} available for the selected option.`, 409);
    const basePrice = variant ? Number(variant.price ?? product.unitPrice) : Number(product.unitPrice);
    const unitPrice = discountedPrice(basePrice, Number(product.discount || 0), String(product.discountType || "amount"));
    const taxPerUnit = product.taxType === "percent" ? round(unitPrice * Number(product.tax || 0) / 100) : round(Number(product.tax || 0));
    const sellerRole = roleBySeller.get(String(product.seller)) || "seller";
    const rate = sellerRole === "seller" ? (categoryWise ? rateByCategory.get(String(product.category)) || 0 : globalRate) : 0;
    items.push({
      _id: new mongoose.Types.ObjectId(), product: product._id, seller: product.seller, sellerRole,
      name: product.name, slug: product.slug, image: product.thumbnail, variation: line.variation,
      unitPrice, tax: round(taxPerUnit * line.quantity), shipping: 0, quantity: line.quantity,
      total: 0, commissionRate: rate, commission: 0, sellerEarning: 0,
      paymentStatus: input.payment === "wallet" ? "paid" : "unpaid", deliveryStatus: "pending",
    });
  }

  const shippingType = String(settings["business.shipping_type"] || "product_wise_shipping");
  if (shippingType === "flat_rate") {
    const totalShipping = Math.max(0, Number(settings["business.flat_rate_shipping_cost"] || 0));
    items.forEach((item, index) => { item.shipping = index === items.length - 1 ? round(totalShipping - items.slice(0, -1).reduce((sum, previous) => sum + previous.shipping, 0)) : round(totalShipping / items.length); });
  } else if (shippingType === "seller_wise_shipping") {
    const groups = new Map<string, OrderItem[]>();
    for (const item of items) { const key = String(item.seller); groups.set(key, [...(groups.get(key) || []), item]); }
    for (const [sellerId, sellerItems] of groups) {
      const groupShipping = roleBySeller.get(sellerId) === "admin" ? Math.max(0, Number(settings["business.shipping_cost_admin"] || 0)) : Math.max(0, Number(shopBySeller.get(sellerId)?.shippingCost || 0));
      sellerItems.forEach((item, index) => { item.shipping = index === sellerItems.length - 1 ? round(groupShipping - sellerItems.slice(0, -1).reduce((sum, previous) => sum + previous.shipping, 0)) : round(groupShipping / sellerItems.length); });
    }
  } else {
    for (const item of items) {
      const product: any = productById.get(String(item.product));
      item.shipping = product.shippingType === "free" ? 0 : round(Number(product.shippingCost || 0));
    }
  }

  for (const item of items) {
    item.total = round(item.unitPrice * item.quantity + item.tax + item.shipping);
    item.commission = round(item.total * item.commissionRate / 100);
    item.sellerEarning = round(item.total - item.commission);
  }
  const subtotal = round(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const tax = round(items.reduce((sum, item) => sum + item.tax, 0));
  const shipping = round(items.reduce((sum, item) => sum + item.shipping, 0));

  let coupon: any;
  let discount = 0;
  if (input.couponCode) {
    const now = new Date();
    coupon = await CouponModel.findOne({
      code: input.couponCode.toUpperCase(), active: true,
      $and: [{ $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }] }],
    }).lean();
    if (!coupon || subtotal < Number(coupon.minimumSpend || 0) || (coupon.usageLimit && coupon.used >= coupon.usageLimit)) throw new CheckoutError("This coupon is invalid or no longer available.");
    if (customerId && await CouponUsageModel.exists({ coupon: coupon._id, user: customerId })) throw new CheckoutError("This coupon has already been used by your account.", 409);
    const eligibleProducts = new Set((coupon.products || []).map((id: unknown) => String(id)));
    const eligibleSubtotal = coupon.type === "product" ? items.filter((item) => eligibleProducts.has(String(item.product)) || String(coupon.product || "") === String(item.product)).reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) : subtotal;
    if (coupon.type === "product" && eligibleSubtotal <= 0) throw new CheckoutError("This coupon does not apply to the products in your cart.");
    discount = coupon.discountType === "percent" ? eligibleSubtotal * Math.min(Number(coupon.discount), 100) / 100 : Number(coupon.discount);
    if (coupon.maximumDiscount != null) discount = Math.min(discount, Number(coupon.maximumDiscount));
    discount = round(Math.min(discount, eligibleSubtotal));
  }

  return { orderId: new mongoose.Types.ObjectId(), code: makeCode(), products, items, subtotal, tax, shipping, discount, total: round(subtotal + tax + shipping - discount), coupon, customerId, input };
}

let transactionCapability: boolean | undefined;
async function transactionsSupported(): Promise<boolean> {
  if (transactionCapability !== undefined) return transactionCapability;
  const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
  transactionCapability = Boolean(hello.setName || hello.msg === "isdbgrid");
  return transactionCapability;
}

function orderDocument(prepared: PreparedOrder) {
  const { input } = prepared;
  return {
    _id: prepared.orderId, code: prepared.code, idempotencyKey: input.idempotencyKey,
    customer: prepared.customerId || null, guestEmail: prepared.customerId ? undefined : input.email,
    shippingAddress: { name: input.name, email: input.email, address: input.address, country: input.country, state: input.state, city: input.city, postalCode: input.postal_code, phone: input.phone },
    items: prepared.items.map(({ sellerRole: _sellerRole, ...item }) => item),
    subtotal: prepared.subtotal, tax: prepared.tax, shipping: prepared.shipping, discount: prepared.discount,
    total: prepared.total, couponCode: prepared.coupon?.code,
    payment: { method: input.payment, status: input.payment === "wallet" ? "paid" : "unpaid", paidAt: input.payment === "wallet" ? new Date() : undefined },
    status: "pending", statusHistory: [{ status: "pending", at: new Date(), note: "Order placed" }], notes: input.notes,
  };
}

async function decrementInventory(prepared: PreparedOrder, session?: ClientSession, changedItems?: OrderItem[]): Promise<void> {
  for (const item of prepared.items) {
    const filter: Record<string, unknown> = { _id: item.product, published: true, stock: { $gte: item.quantity } };
    const update: Record<string, number> = { stock: -item.quantity, sales: item.quantity };
    if (item.variation) {
      filter.variants = { $elemMatch: { name: item.variation, stock: { $gte: item.quantity } } };
      update["variants.$.stock"] = -item.quantity;
    }
    const result = await ProductModel.updateOne(filter, { $inc: update }, { session });
    if (result.modifiedCount !== 1) throw new CheckoutError(`${item.name} changed stock while you were checking out. Please review your cart.`, 409);
    changedItems?.push(item);
  }
}

async function restoreInventory(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    const update: Record<string, number> = { stock: item.quantity, sales: -item.quantity };
    if (item.variation) update["variants.$[variant].stock"] = item.quantity;
    await ProductModel.updateOne({ _id: item.product }, { $inc: update }, item.variation ? { arrayFilters: [{ "variant.name": item.variation }] } : {}).catch(() => undefined);
  }
}

async function applySellerLedger(prepared: PreparedOrder, session?: ClientSession): Promise<void> {
  for (const item of prepared.items.filter((candidate) => candidate.sellerRole === "seller")) {
    const balanceDelta = prepared.input.payment === "cod" ? -item.commission : item.sellerEarning;
    const shop = await ShopModel.findOneAndUpdate({ owner: item.seller, active: true }, { $inc: { adminToPay: balanceDelta } }, { new: true, session });
    if (!shop) throw new CheckoutError(`The seller account for ${item.name} is not ready to receive orders.`, 409);
    try {
      await SellerLedgerModel.create([{
        seller: item.seller, shop: shop._id, order: prepared.orderId, orderItem: item._id, type: "sale",
        paymentMethod: prepared.input.payment, gross: item.total, commission: item.commission,
        net: item.sellerEarning, balanceDelta, balanceAfter: shop.adminToPay, reference: prepared.code, status: "completed",
      }], session ? { session } : undefined);
    } catch (error) {
      await ShopModel.updateOne({ _id: shop._id }, { $inc: { adminToPay: -balanceDelta } }, { session }).catch(() => undefined);
      throw error;
    }
  }
}

async function reverseSellerLedger(prepared: PreparedOrder): Promise<void> {
  const ledgers = await SellerLedgerModel.find({ order: prepared.orderId }).lean().catch(() => []);
  for (const ledger of ledgers) await ShopModel.updateOne({ _id: ledger.shop }, { $inc: { adminToPay: -Number(ledger.balanceDelta || 0) } }).catch(() => undefined);
  await SellerLedgerModel.deleteMany({ order: prepared.orderId }).catch(() => undefined);
}

async function executeOrder(prepared: PreparedOrder, session?: ClientSession): Promise<void> {
  await decrementInventory(prepared, session);
  let walletBalanceAfter: number | undefined;
  if (prepared.input.payment === "wallet") {
    const user = await User.findOneAndUpdate({ _id: prepared.customerId, status: "active", balance: { $gte: prepared.total } }, { $inc: { balance: -prepared.total } }, { new: true, session });
    if (!user) throw new CheckoutError("Your wallet does not have enough balance.", 409);
    walletBalanceAfter = user.balance;
  }
  if (prepared.coupon) {
    const couponUpdate = await CouponModel.updateOne({
      _id: prepared.coupon._id, active: true,
      $or: [{ usageLimit: null }, { usageLimit: { $exists: false } }, { $expr: { $lt: ["$used", "$usageLimit"] } }],
    }, { $inc: { used: 1 } }, { session });
    if (couponUpdate.modifiedCount !== 1) throw new CheckoutError("This coupon reached its usage limit while you were checking out.", 409);
  }
  await OrderModel.create([orderDocument(prepared)], session ? { session } : undefined);
  if (prepared.coupon && prepared.customerId) await CouponUsageModel.create([{ coupon: prepared.coupon._id, user: prepared.customerId, order: prepared.orderId }], session ? { session } : undefined);
  if (prepared.input.payment === "wallet") await WalletTransactionModel.create([{ user: prepared.customerId, type: "debit", amount: prepared.total, balanceAfter: walletBalanceAfter!, paymentMethod: "wallet", reference: prepared.code, status: "completed" }], session ? { session } : undefined);
  await applySellerLedger(prepared, session);
  if (prepared.customerId) await CartModel.deleteOne({ user: prepared.customerId }, { session });
}

async function executeCompensatingCod(prepared: PreparedOrder): Promise<void> {
  if (prepared.input.payment !== "cod") throw new CheckoutError("Wallet checkout requires a MongoDB replica set so balance and inventory changes remain atomic.", 503);
  const inventoryChanges: OrderItem[] = [];
  let couponChanged = false;
  let orderCreated = false;
  try {
    await decrementInventory(prepared, undefined, inventoryChanges);
    if (prepared.coupon) {
      const result = await CouponModel.updateOne({ _id: prepared.coupon._id, active: true, $or: [{ usageLimit: null }, { usageLimit: { $exists: false } }, { $expr: { $lt: ["$used", "$usageLimit"] } }] }, { $inc: { used: 1 } });
      if (result.modifiedCount !== 1) throw new CheckoutError("This coupon reached its usage limit while you were checking out.", 409);
      couponChanged = true;
    }
    await OrderModel.create(orderDocument(prepared));
    orderCreated = true;
    if (prepared.coupon && prepared.customerId) await CouponUsageModel.create({ coupon: prepared.coupon._id, user: prepared.customerId, order: prepared.orderId });
    await applySellerLedger(prepared);
    if (prepared.customerId) await CartModel.deleteOne({ user: prepared.customerId });
  } catch (error) {
    await reverseSellerLedger(prepared);
    if (orderCreated) await OrderModel.deleteOne({ _id: prepared.orderId }).catch(() => undefined);
    if (prepared.coupon && prepared.customerId) await CouponUsageModel.deleteOne({ order: prepared.orderId }).catch(() => undefined);
    if (couponChanged) await CouponModel.updateOne({ _id: prepared.coupon._id, used: { $gt: 0 } }, { $inc: { used: -1 } }).catch(() => undefined);
    if (inventoryChanges.length) await restoreInventory(inventoryChanges);
    throw error;
  }
}

export async function placeOrder(input: CheckoutInput, customerId?: Types.ObjectId): Promise<{ code: string; repeated?: boolean }> {
  await connectMongo();
  const existing = await OrderModel.findOne({ idempotencyKey: input.idempotencyKey }).select("code customer guestEmail").lean();
  if (existing) {
    const sameOwner = customerId ? String(existing.customer || "") === String(customerId) : !existing.customer && existing.guestEmail === input.email;
    if (!sameOwner) throw new CheckoutError("This checkout key has already been used.", 409);
    return { code: existing.code, repeated: true };
  }
  const prepared = await prepareOrder(input, customerId);
  try {
    if (await transactionsSupported()) {
      const session = await mongoose.startSession();
      try { await session.withTransaction(() => executeOrder(prepared, session)); }
      finally { await session.endSession(); }
    } else {
      await executeCompensatingCod(prepared);
    }
    return { code: prepared.code };
  } catch (error) {
    if (isMongoDuplicate(error)) {
      const duplicate = await OrderModel.findOne({ idempotencyKey: input.idempotencyKey }).select("code").lean().catch(() => null);
      if (duplicate) return { code: duplicate.code, repeated: true };
    }
    throw error;
  }
}

export async function quoteCart(lines: CheckoutInput["lines"], couponCode: string | undefined, customerId: Types.ObjectId, email: string): Promise<{ subtotal: number; tax: number; shipping: number; discount: number; total: number; couponCode?: string }> {
  const prepared = await prepareOrder({ name: "Cart customer", email, address: "Quote address", city: "Quote city", postal_code: "00000", country: "India", phone: "00000", payment: "cod", couponCode, idempotencyKey: crypto.randomUUID(), lines }, customerId);
  return { subtotal: prepared.subtotal, tax: prepared.tax, shipping: prepared.shipping, discount: prepared.discount, total: prepared.total, couponCode: prepared.coupon?.code };
}
