import type { ClientSession } from "mongoose";
import { Product } from "../models/Product.js";
import { InventoryMovement } from "../models/Ledger.js";
import { ApiError } from "../middleware/errorHandler.js";

export interface StockLine {
  productId: string;
  variantSku: string;
  quantity: number;
}

// Holds stock without decrementing the sellable count yet — `stock - reserved`
// is what's shown as "available" everywhere else in the app. The oversell guard
// (`stock - reserved >= quantity`) is evaluated inside the same atomic update via
// $elemMatch + $expr, so two concurrent checkouts can't both reserve the last unit.
export async function reserveStock(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: line.productId,
        variants: {
          $elemMatch: {
            sku: line.variantSku,
            $expr: { $gte: [{ $subtract: ["$stock", "$reserved"] }, line.quantity] },
          },
        },
      },
      { $inc: { "variants.$.reserved": line.quantity } },
      { session, new: true },
    );

    if (!updated) {
      throw new ApiError(409, "One of the items in your cart no longer has enough stock available");
    }

    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "reserve", quantity: line.quantity, orderId }],
      { session },
    );
  }
}

// Converts a reservation into an actual stock decrement (payment confirmed / COD order placed).
export async function confirmReservation(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    await Product.updateOne(
      { _id: line.productId, "variants.sku": line.variantSku },
      { $inc: { "variants.$[v].reserved": -line.quantity, "variants.$[v].stock": -line.quantity } },
      { session, arrayFilters: [{ "v.sku": line.variantSku }] },
    );
    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "confirm", quantity: line.quantity, orderId }],
      { session },
    );
  }
}

// Releases a reservation without touching sellable stock (order cancelled before payment).
export async function releaseReservation(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    await Product.updateOne(
      { _id: line.productId, "variants.sku": line.variantSku },
      { $inc: { "variants.$[v].reserved": -line.quantity } },
      { session, arrayFilters: [{ "v.sku": line.variantSku }] },
    );
    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "release", quantity: line.quantity, orderId }],
      { session },
    );
  }
}
