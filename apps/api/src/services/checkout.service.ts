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
import { calculateCommission } from "./commission.service.js";
import { reserveStock, confirmReservation, type StockLine } from "./inventory.service.js";
import { validateCoupon, recordCouponUsage } from "./coupon.service.js";
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
      const bySeller = new Map<string, { items: (typeof Order extends never ? never : any)[]; subtotal: number }>();
      const stockLines: StockLine[] = [];

      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId).session(session);
        if (!product || !product.published) throw new ApiError(409, "One of the items in your cart is no longer available");
        const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
        if (!variant) throw new ApiError(409, "One of the selected variants is no longer available");

        const sellerId = String(product.sellerId);
        const bucket = bySeller.get(sellerId) ?? { items: [], subtotal: 0 };
        const lineTotal = variant.price * cartItem.quantity;
        bucket.items.push({
          productId: product._id,
          variantSku: variant.sku,
          name: product.name,
          attributes: variant.attributes,
          quantity: cartItem.quantity,
          unitPrice: variant.price,
          imageUrl: variant.imageUrl ?? product.images[0],
        });
        bucket.subtotal += lineTotal;
        bySeller.set(sellerId, bucket);

        stockLines.push({ productId: String(product._id), variantSku: variant.sku, quantity: cartItem.quantity });
      }

      await reserveStock(stockLines, String(orderId), session);

      const settings = await BusinessSetting.findOne({ key: "business" }).session(session);
      const taxPercent = settings?.taxPercent ?? 0;
      const shippingTotal = settings?.shippingMode === "free" ? 0 : settings?.flatShippingCost ?? 0;

      const details = [];
      let subtotalSum = 0;
      for (const [sellerId, bucket] of bySeller) {
        const { rate, amount } = await calculateCommission(sellerId, bucket.subtotal);
        details.push({
          sellerId,
          items: bucket.items,
          subtotal: bucket.subtotal,
          commissionRate: rate,
          commissionAmount: amount,
          shippingCost: 0,
          status: "pending",
        });
        subtotalSum += bucket.subtotal;
      }

      let discount = 0;
      if (input.couponCode) {
        const result = await validateCoupon(input.couponCode, subtotalSum, input.owner);
        discount = result.discount;
      }

      const tax = Math.round(((subtotalSum - discount) * taxPercent) / 100 * 100) / 100;
      const grandTotal = Math.max(0, subtotalSum - discount + tax + shippingTotal);

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
            discount,
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

      if (input.couponCode) {
        await recordCouponUsage(input.couponCode, String(order!._id), input.owner);
      }

      await Cart.deleteOne({ _id: cart._id }).session(session);
      createdOrder = order;
    });

    if (!createdOrder) throw new ApiError(500, "Order could not be created");
    return createdOrder;
  } finally {
    await session.endSession();
  }
}
