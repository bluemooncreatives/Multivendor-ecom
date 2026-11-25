import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger, InventoryMovement } from "../models/Ledger.js";
import { reverseAffiliateForOrder } from "./affiliate.service.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { AuthenticatedUser } from "../middleware/auth.js";
import { inventoryStatus } from "./order-state.js";
import { restorePointsForOrder } from "./clubpoints.service.js";
import { CouponUsage } from "../models/Coupon.js";
import { releaseDealStock, dealLinesFromOrder } from "./flashdeal.service.js";
import { shipmentTotal } from "./shipment-totals.js";
import { queueOrderSms } from "./order-sms.service.js";

// IDOR guard: customers only ever see their own orders; sellers only orders
// containing at least one of their own items; staff/admin can see any.
export async function getOrderForRequester(orderId: string, requester: AuthenticatedUser) {
  const filter =
    canManageOrders(requester)
      ? { _id: orderId }
      : requester.role === "seller"
        ? { _id: orderId, $or: [{ userId: requester.id }, { "details.sellerId": requester.id }] }
        : { _id: orderId, userId: requester.id };
  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export async function listOrdersForUser(userId: string) {
  return Order.find({ userId }).sort({ createdAt: -1 });
}

export async function listOrdersForSeller(sellerId: string) {
  const orders = await Order.find({ "details.sellerId": sellerId }).sort({ createdAt: -1 });
  return orders.map((order) => sellerOrderView(order, sellerId));
}

export function sellerOrderView(order: InstanceType<typeof Order>, sellerId: string) {
  const details = order.details.filter((detail) => String(detail.sellerId) === sellerId);
  return {
    id: String(order._id), code: order.code, currency: order.currency, addressSnapshot: order.addressSnapshot,
    paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, createdAt: order.createdAt,
    status: details[0]?.status ?? order.status, details,
    grandTotal: Math.round(details.reduce((sum, detail) => sum + shipmentTotal(order, order.details.indexOf(detail)), 0) * 100) / 100,
  };
}

function canManageOrders(requester: AuthenticatedUser) {
  return requester.role === "admin" || (requester.role === "staff" && requester.permissions?.includes("orders.manage"));
}

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

// Reverses everything createOrder committed: restocks inventory, reverses the
// seller ledger entries, and refunds the wallet debit — all inside one transaction
// so a crash mid-cancellation can't leave stock/ledger/wallet in an inconsistent state.
export async function cancelOrder(orderId: string, requester: AuthenticatedUser) {
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const filter =
        canManageOrders(requester) ? { _id: orderId } : { _id: orderId, userId: requester.id };
      const order = await Order.findOne(filter).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (order.status === "cancelled") { result = order; return; }
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new ApiError(409, `Order cannot be cancelled once it is ${order.status}`);
      }

      if (order.details.some((detail) => !CANCELLABLE_STATUSES.includes(detail.status))) {
        throw new ApiError(409, "An order with items already in fulfillment cannot be cancelled");
      }
      if (order.paymentStatus === "paid" && order.paymentMethod !== "wallet") {
        throw new ApiError(409, "Refund the captured payment before cancelling this order");
      }
      const wasConfirmed = inventoryStatus(order) === "confirmed";

      for (const detail of order.details) {
        for (const item of detail.items) {
          if (wasConfirmed) {
            // Stock was already decremented at confirm-time — restock it.
            await Product.updateOne(
              { _id: item.productId, "variants.sku": item.variantSku },
              { $inc: { "variants.$[v].stock": item.quantity } },
              { session, arrayFilters: [{ "v.sku": item.variantSku }] },
            );
          } else {
            // Still just a reservation — release the hold.
            await Product.updateOne(
              { _id: item.productId, "variants.sku": item.variantSku },
              { $inc: { "variants.$[v].reserved": -item.quantity } },
              { session, arrayFilters: [{ "v.sku": item.variantSku }] },
            );
          }
          await InventoryMovement.create(
            [
              {
                productId: item.productId,
                variantSku: item.variantSku,
                type: wasConfirmed ? "restock" : "release",
                quantity: item.quantity,
                orderId: order._id,
                note: "Order cancelled",
              },
            ],
            { session },
          );
        }
        detail.status = "cancelled";
        detail.cancelledAt = new Date();

        // Admin-owned lines never produced a ledger entry, so there is none to reverse.
        if (wasConfirmed && detail.sellerId && order.paymentMethod !== "cod") {
          await SellerLedger.create(
            [
              { sellerId: detail.sellerId, orderId: order._id, type: "refund", amount: -detail.subtotal, note: "Order cancelled" },
              { sellerId: detail.sellerId, orderId: order._id, type: "commission", amount: detail.commissionAmount, note: "Commission reversed" },
            ],
            { session, ordered: true },
          );
        }
      }

      if (order.paymentMethod === "wallet" && order.paymentStatus === "paid" && order.userId) {
        const wallet = await Wallet.findOneAndUpdate(
          { userId: order.userId },
          { $inc: { balance: order.grandTotal } },
          { session, new: true, upsert: true },
        );
        await WalletTransaction.create(
          [
            {
              userId: order.userId,
              amount: order.grandTotal,
              balanceAfter: wallet?.balance ?? order.grandTotal,
              reason: "Order cancellation refund",
              refType: "refund",
              refId: order._id,
              idempotencyKey: `order:${order._id}:cancel-refund`,
            },
          ],
          { session },
        );
        order.paymentStatus = "refunded";
      }

      // Any flash-deal allowance the order consumed is returned to the campaign.
      await releaseDealStock(dealLinesFromOrder(order), session);

      order.status = "cancelled";
      order.inventoryStatus = "released";
      await restorePointsForOrder(String(order._id), session);
      await CouponUsage.deleteMany({ orderId: order._id }).session(session);
      await order.save({ session });
      for (let index = 0; index < order.details.length; index++) await queueOrderSms(order, "delivery", session, index);
      if (order.paymentStatus === "refunded") await queueOrderSms(order, "payment", session);
      result = order;
    });

    // Referral commission is clawed back outside the transaction (it opens its own),
    // and is a no-op when the order never earned any.
    await reverseAffiliateForOrder(orderId);

    return result;
  } finally {
    await session.endSession();
  }
}
