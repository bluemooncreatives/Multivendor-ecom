import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Wallet, WalletTransaction } from "../models/Wallet.js";
import { SellerLedger, InventoryMovement } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { AuthenticatedUser } from "../middleware/auth.js";

// IDOR guard: customers only ever see their own orders; sellers only orders
// containing at least one of their own items; staff/admin can see any.
export async function getOrderForRequester(orderId: string, requester: AuthenticatedUser) {
  const filter =
    requester.role === "admin" || requester.role === "staff"
      ? { _id: orderId }
      : requester.role === "seller"
        ? { _id: orderId, "details.sellerId": requester.id }
        : { _id: orderId, userId: requester.id };
  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export async function listOrdersForUser(userId: string) {
  return Order.find({ userId }).sort({ createdAt: -1 });
}

export async function listOrdersForSeller(sellerId: string) {
  return Order.find({ "details.sellerId": sellerId }).sort({ createdAt: -1 });
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
        requester.role === "admin" || requester.role === "staff" ? { _id: orderId } : { _id: orderId, userId: requester.id };
      const order = await Order.findOne(filter).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new ApiError(409, `Order cannot be cancelled once it is ${order.status}`);
      }

      const wasConfirmed = order.status === "confirmed";

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

        if (wasConfirmed) {
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
          { session, new: true },
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

      order.status = "cancelled";
      await order.save({ session });
      result = order;
    });
    return result;
  } finally {
    await session.endSession();
  }
}
