import { PickupPoint } from "../models/Marketing.js";
import type { Order } from "../models/Order.js";
import type { AuthenticatedUser } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { ClientSession } from "mongoose";
import { shipmentTotal } from "./shipment-totals.js";

export function pickupScope(user: AuthenticatedUser) {
  return user.role === "admin" ? {} : { staffId: user.id };
}

export async function getManagedPickupPoint(id: string, user: AuthenticatedUser, session?: ClientSession) {
  const point = await PickupPoint.findOne({ _id: id, ...pickupScope(user) }).session(session ?? null);
  if (!point) throw new ApiError(404, "Pickup point not found");
  return point;
}

/** A collection point sees only the shipments physically routed to it. */
export function pickupOrderView(order: InstanceType<typeof Order>, pickupPointId: string) {
  const details = order.details.filter((detail) => String(detail.pickupPointId) === pickupPointId);
  return {
    id: String(order._id), code: order.code, createdAt: order.createdAt,
    addressSnapshot: order.addressSnapshot, currency: order.currency,
    paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, details,
    grandTotal: Math.round(details.reduce((sum, detail) => sum + shipmentTotal(order, order.details.indexOf(detail)), 0) * 100) / 100,
  };
}
