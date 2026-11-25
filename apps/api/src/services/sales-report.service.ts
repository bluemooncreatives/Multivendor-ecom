import { Order } from "../models/Order.js";
import { RefundRequest } from "../models/Refund.js";

/** Placed order count, captured revenue and wallet merchandise refunds. */
export async function salesTotals(dateFilter: Record<string, Date> = {}) {
  const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
  const paid = { $and: [{ $eq: ["$paymentStatus", "paid"] }, { $ne: ["$status", "cancelled"] }] };
  const [totals] = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, orders: { $sum: 1 },
      grossRevenue: { $sum: { $cond: [paid, "$grandTotal", 0] } },
      discount: { $sum: { $cond: [paid, "$discount", 0] } },
      tax: { $sum: { $cond: [paid, "$tax", 0] } },
    } },
  ]);
  const [refunds] = await RefundRequest.aggregate([
    { $match: { status: "refunded" } },
    { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "order" } },
    { $unwind: "$order" },
    { $match: { "order.paymentStatus": "paid", ...(Object.keys(dateFilter).length ? { "order.createdAt": dateFilter } : {}) } },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]);
  const grossRevenue = totals?.grossRevenue ?? 0;
  const refunded = refunds?.amount ?? 0;
  return { orders: totals?.orders ?? 0, grossRevenue, refunded,
    revenue: Math.round((grossRevenue - refunded) * 100) / 100, discount: totals?.discount ?? 0, tax: totals?.tax ?? 0 };
}
