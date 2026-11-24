import { ApiError } from "../middleware/errorHandler.js";

type OrderState = {
  inventoryStatus?: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
};

// Older orders predate the explicit inventory marker. COD/wallet stock was
// consumed at checkout, while a pending gateway order only held a reservation.
export function inventoryStatus(order: OrderState): "reserved" | "confirmed" | "released" {
  if (order.inventoryStatus === "reserved" || order.inventoryStatus === "confirmed" || order.inventoryStatus === "released") {
    return order.inventoryStatus;
  }
  if (["cancelled", "refunded"].includes(order.status)) return "released";
  if (order.paymentMethod === "cod" || order.paymentMethod === "wallet" || order.paymentStatus === "paid") return "confirmed";
  return "reserved";
}

export function assertPayable(order: OrderState, method?: string) {
  if (["cancelled", "refunded"].includes(order.status) || ["failed", "refunded"].includes(order.paymentStatus)) {
    throw new ApiError(409, "This order is closed; start a new checkout");
  }
  if (order.paymentStatus === "paid") throw new ApiError(409, "Order is already paid");
  if (method && order.paymentMethod !== method) throw new ApiError(409, "Payment method does not match the order");
}
