import type { Order } from "../models/Order.js";
import { allocateUnits } from "../utils/allocation.js";

export function shipmentTotal(order: InstanceType<typeof Order>, index: number) {
  const detail = order.details[index]!;
  const weights = order.details.map((shipment) => shipment.subtotal);
  const discount = detail.discount ?? allocateUnits(Math.round(order.discount * 100), weights)[index]! / 100;
  const tax = detail.tax ?? allocateUnits(Math.round(order.tax * 100), weights)[index]! / 100;
  return Math.round((detail.subtotal - discount + tax + detail.shippingCost) * 100) / 100;
}
