import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { Address } from "../models/Address.js";
import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";
import { WalletTransaction } from "../models/Wallet.js";
import { SellerLedger } from "../models/Ledger.js";
import { BusinessSetting } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";
import { Category } from "../models/Category.js";
import { PickupPoint } from "../models/Marketing.js";
import { User } from "../models/User.js";
import { logger } from "../config/logger.js";
import { renderInvoiceBuffer } from "./invoice.service.js";
import { sendOrderConfirmationEmail } from "./email.service.js";
import { calculateCommission } from "./commission.service.js";
import { reserveStock, confirmReservation, type StockLine } from "./inventory.service.js";
import { validateCoupon, recordCouponUsage, type CouponLine } from "./coupon.service.js";
import { calculateShipping, priceLine, sellerKey, ADMIN_BUCKET, type ShippableLine } from "./shipping.service.js";
import { spendPointsForOrder } from "./clubpoints.service.js";
import type { CartOwner } from "./cart.service.js";
import type { PaymentMethod } from "@ecommercemultivendor/types";

export interface InlineAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface CheckoutInput {
  owner: CartOwner;
  addressId?: string;
  address?: InlineAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  /**
   * Per-seller delivery choice from the legacy delivery-info step. Keys are seller
   * ids (or "__admin__" for In-House items); a pickup point id means that seller's
   * items are collected in person and carry no shipping.
   */
  deliveryChoices?: Record<string, { method: "home_delivery" | "pickup_point"; pickupPointId?: string }>;
  /** Club points to redeem against this order. */
  clubPoints?: number;
  idempotencyKey: string;
}

// Methods that settle synchronously at order-creation time (no external gateway
// round-trip), so stock is confirmed and the order is marked confirmed immediately.
const SYNCHRONOUS_METHODS: PaymentMethod[] = ["cod", "wallet"];

export async function createOrder(input: CheckoutInput) {
  const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey });
  if (existing) return existing; // replayed request — return the already-created order, don't double-charge

  const cart = await Cart.findOne(input.owner.userId ? { userId: input.owner.userId } : { guestId: input.owner.guestId });
  if (!cart || cart.items.length === 0) throw new ApiError(400, "Your cart is empty");

  let addressSnapshot: InlineAddress;
  if (input.addressId) {
    if (!input.owner.userId) throw new ApiError(400, "Saved addresses require an account");
    const address = await Address.findOne({ _id: input.addressId, userId: input.owner.userId });
    if (!address) throw new ApiError(404, "Address not found");
    addressSnapshot = address.toObject();
  } else if (input.address) {
    addressSnapshot = input.address;
  } else {
    throw new ApiError(400, "A shipping address is required");
  }

  const session = await mongoose.startSession();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createdOrder: any = null;

    await session.withTransaction(async () => {
      const orderId = new mongoose.Types.ObjectId();

      // Snapshot every product/variant inside the transaction so pricing can never
      // drift between "what the shopper saw" and "what they're charged" mid-checkout.
      const settings = await BusinessSetting.findOne({ key: "business" }).session(session);
      const storeTaxPercent = settings?.taxPercent ?? 0;

      // Admin-owned products have no seller, so they group under a reserved key and
      // settle with zero commission — the platform is both merchant and payee.
      const bySeller = new Map<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { items: any[]; subtotal: number; tax: number; categoryId: string | null; sellerId: string | null }
      >();
      const stockLines: StockLine[] = [];
      const shippableLines: ShippableLine[] = [];
      const couponLines: CouponLine[] = [];

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId).session(session);
        if (!product || !product.published) throw new ApiError(409, "One of the items in your cart is no longer available");
        const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
        if (!variant) throw new ApiError(409, "One of the selected variants is no longer available");

        // Discount and tax are resolved per line from the product's own settings,
        // falling back to the store rate — the previous version applied a single
        // global tax percentage to the whole order and ignored product discounts.
        const { unitPrice, lineSubtotal, lineTax } = priceLine({
          unitPrice: variant.price,
          quantity: cartItem.quantity,
          discount: product.discount ?? 0,
          discountType: (product.discountType ?? "percent") as "flat" | "percent",
          tax: product.tax ?? null,
          taxType: (product.taxType ?? "percent") as "flat" | "percent",
          storeTaxPercent,
        });

        const sellerId = product.sellerId ? String(product.sellerId) : null;
        const key = sellerKey(sellerId);
        const bucket = bySeller.get(key) ?? {
          items: [],
          subtotal: 0,
          tax: 0,
          categoryId: String(product.categoryId),
          sellerId,
        };

        bucket.items.push({
          productId: product._id,
          variantSku: variant.sku,
          name: product.name,
          attributes: variant.attributes,
          quantity: cartItem.quantity,
          unitPrice,
          imageUrl: variant.imageUrl ?? product.images[0],
        });
        bucket.subtotal += lineSubtotal;
        bucket.tax += lineTax;
        bySeller.set(key, bucket);

        stockLines.push({ productId: String(product._id), variantSku: variant.sku, quantity: cartItem.quantity });
        shippableLines.push({
          sellerId,
          quantity: cartItem.quantity,
          shippingType: (product.shippingType ?? "free") as "free" | "flat_rate",
          shippingCost: product.shippingCost ?? 0,
        });
        couponLines.push({
          productId: String(product._id),
          categoryId: String(product.categoryId),
          lineSubtotal,
        });
      }

      await reserveStock(stockLines, String(orderId), session);

      // Category ancestors let a coupon scoped to a parent category match products
      // filed under any of its descendants.
      const lineCategoryIds = [...new Set(couponLines.map((l) => l.categoryId))];
      const lineCategories = await Category.find({ _id: { $in: lineCategoryIds } }, { ancestors: 1 })
        .session(session)
        .lean();
      const ancestorsById = new Map(lineCategories.map((c) => [String(c._id), (c.ancestors ?? []).map(String)]));
      for (const line of couponLines) line.categoryPath = ancestorsById.get(line.categoryId) ?? [];

      // Resolve the per-seller delivery choice, validating any pickup point named.
      const pickupBuckets = new Set<string>();
      const pickupPointByBucket: Record<string, string> = {};
      for (const [bucket, choice] of Object.entries(input.deliveryChoices ?? {})) {
        if (choice.method !== "pickup_point") continue;
        if (!bySeller.has(bucket)) continue; // stale choice for an item no longer in the cart
        if (!choice.pickupPointId) throw new ApiError(400, "Choose a pickup point for in-person collection");

        const point = await PickupPoint.findOne({ _id: choice.pickupPointId, active: true }).session(session);
        if (!point) throw new ApiError(400, "That pickup point is not available");

        pickupBuckets.add(bucket);
        pickupPointByBucket[bucket] = String(point._id);
      }

      const subtotalSum = round2([...bySeller.values()].reduce((sum, b) => sum + b.subtotal, 0));

      const shippingByBucket = await calculateShipping(
        shippableLines,
        {
          mode: (settings?.shippingMode ?? "flat") as "flat" | "product_wise" | "seller_wise" | "free",
          flatShippingCost: settings?.flatShippingCost ?? 0,
          adminShippingCost: settings?.adminShippingCost ?? 0,
          minOrderForFreeShipping: settings?.minOrderForFreeShipping ?? null,
        },
        pickupBuckets,
        subtotalSum,
        session,
      );

      const details = [];
      let taxSum = 0;
      let shippingTotal = 0;
      for (const [key, bucket] of bySeller) {
        const { rate, amount } = await calculateCommission(bucket.sellerId, bucket.subtotal, bucket.categoryId);
        const shippingCost = shippingByBucket.get(key) ?? 0;
        details.push({
          sellerId: bucket.sellerId,
          items: bucket.items,
          subtotal: round2(bucket.subtotal),
          commissionRate: rate,
          commissionAmount: amount,
          shippingCost,
          pickupPointId: pickupPointByBucket[key] ?? null,
          status: "pending",
        });
        taxSum += bucket.tax;
        shippingTotal += shippingCost;
      }
      taxSum = round2(taxSum);
      shippingTotal = round2(shippingTotal);

      let discount = 0;
      let couponId: string | null = null;
      if (input.couponCode) {
        const result = await validateCoupon(input.couponCode, subtotalSum, input.owner, couponLines);
        discount = result.discount;
        couponId = String(result.coupon._id);
      }

      // Club points are redeemed as a discount, debited inside this transaction so
      // a failed order never consumes them.
      let clubPointsDiscount = 0;
      if (input.clubPoints && input.clubPoints > 0) {
        if (!input.owner.userId) throw new ApiError(400, "Club points require an account");
        clubPointsDiscount = await spendPointsForOrder(input.owner.userId, input.clubPoints, String(orderId), session);
      }

      // Discounts can exceed the goods value (a large coupon plus points); cap the
      // total so tax and shipping are never discounted into a negative order.
      const totalDiscount = Math.min(round2(discount + clubPointsDiscount), subtotalSum);
      const grandTotal = round2(Math.max(0, subtotalSum - totalDiscount + taxSum + shippingTotal));
      const tax = taxSum;

      const synchronous = SYNCHRONOUS_METHODS.includes(input.paymentMethod);

      if (input.paymentMethod === "wallet") {
        if (!input.owner.userId) throw new ApiError(400, "Wallet payment requires an account");
        const debited = await Wallet.findOneAndUpdate(
          { userId: input.owner.userId, balance: { $gte: grandTotal } },
          { $inc: { balance: -grandTotal } },
          { session, new: true },
        );
        if (!debited) throw new ApiError(402, "Insufficient wallet balance");

        await WalletTransaction.create(
          [
            {
              userId: input.owner.userId,
              amount: -grandTotal,
              balanceAfter: debited.balance,
              reason: "Order payment",
              refType: "order",
              refId: orderId,
              idempotencyKey: `order:${orderId}:wallet-debit`,
            },
          ],
          { session },
        );
      }

      if (synchronous) {
        await confirmReservation(stockLines, String(orderId), session);
        for (const detail of details) {
          detail.status = "confirmed";
          // Admin-owned lines have no vendor account to credit.
          if (!detail.sellerId) continue;
          await SellerLedger.create(
            [
              { sellerId: detail.sellerId, orderId, type: "sale", amount: detail.subtotal, note: "Order confirmed" },
              { sellerId: detail.sellerId, orderId, type: "commission", amount: -detail.commissionAmount, note: "Platform commission" },
            ],
            { session, ordered: true },
          );
        }
      }

      const [order] = await Order.create(
        [
          {
            _id: orderId,
            code: orderId.toHexString(),
            userId: input.owner.userId ?? null,
            guestId: input.owner.guestId ?? null,
            addressId: input.addressId ?? null,
            addressSnapshot,
            details,
            couponCode: input.couponCode ?? null,
            discount: totalDiscount,
            couponDiscount: discount,
            clubPointsSpent: input.clubPoints ?? 0,
            clubPointsDiscount,
            tax,
            shippingTotal,
            grandTotal,
            currency: "INR",
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentMethod === "wallet" ? "paid" : synchronous ? "unpaid" : "pending",
            status: synchronous ? "confirmed" : "pending",
            idempotencyKey: input.idempotencyKey,
          },
        ],
        { session },
      );

      // The coupon *id*, not the code — CouponUsage.couponId is an ObjectId ref,
      // so passing the code here threw a cast error and no usage was ever recorded.
      if (couponId) {
        await recordCouponUsage(couponId, String(order!._id), input.owner);
      }

      await Cart.deleteOne({ _id: cart._id }).session(session);
      createdOrder = order;
    });

    if (!createdOrder) throw new ApiError(500, "Order could not be created");

    // Fired after the transaction commits, and deliberately not awaited: a slow or
    // misconfigured SMTP host must not delay (or fail) a checkout that has already
    // been paid for.
    void sendInvoiceEmail(createdOrder);

    return createdOrder;
  } finally {
    await session.endSession();
  }
}

async function sendInvoiceEmail(order: InstanceType<typeof Order>) {
  try {
    if (!order.userId) return; // guest checkout has no account email on file
    const user = await User.findById(order.userId, { email: 1 });
    if (!user?.email) return;

    const pdf = await renderInvoiceBuffer(order, { variant: "customer" });
    await sendOrderConfirmationEmail(user.email, order, pdf);
  } catch (err) {
    logger.error(`Failed to send invoice email for order ${order.code}: ${String(err)}`);
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
