import { Types, type ClientSession } from "mongoose";
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
// (`stock - reserved >= quantity`) is evaluated atomically via an aggregation-
// pipeline update ($map/$cond over the variants array), NOT arrayFilters: MongoDB
// rejects $expr inside both $elemMatch queries ("can only be applied to the
// top-level document") and arrayFilters conditions ("$expr is not allowed in
// this context") on this server version. The pipeline update only rewrites the
// matching variant when the guard passes, so `modifiedCount === 0` reliably means
// "not enough stock" — no separate read-then-write race is needed.
//
// Uses the native driver (Product.collection), not the Mongoose model, since
// Mongoose has no query-builder support for pipeline-style updates.
export async function reserveStock(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) throw new ApiError(400, "Stock quantity must be a positive integer");
    const result = await Product.collection.updateOne(
      { _id: new Types.ObjectId(line.productId), "variants.sku": line.variantSku },
      [
        {
          $set: {
            variants: {
              $map: {
                input: "$variants",
                as: "v",
                in: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$$v.sku", line.variantSku] },
                        { $gte: [{ $subtract: ["$$v.stock", "$$v.reserved"] }, line.quantity] },
                      ],
                    },
                    { $mergeObjects: ["$$v", { reserved: { $add: ["$$v.reserved", line.quantity] } }] },
                    "$$v",
                  ],
                },
              },
            },
          },
        },
      ],
      { session },
    );

    if (result.matchedCount === 0 || result.modifiedCount === 0) {
      throw new ApiError(409, "One of the items in your cart no longer has enough stock available");
    }

    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "reserve", quantity: line.quantity, orderId }],
      { session },
    );
  }
}

// Converts a reservation into an actual stock decrement (payment confirmed / COD order placed).
// This is the moment a sale becomes real, so the best-seller counter (`numOfSale`,
// the legacy `num_of_sale`) advances here in the same atomic write — never on a mere
// reservation and never again on release — matching the POS sale path. Legacy bumped
// it by one per line; this app counts units sold, consistent with POS.
export async function confirmReservation(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    const result = await Product.updateOne(
      { _id: line.productId, variants: { $elemMatch: { sku: line.variantSku, reserved: { $gte: line.quantity }, stock: { $gte: line.quantity } } } },
      { $inc: { "variants.$[v].reserved": -line.quantity, "variants.$[v].stock": -line.quantity, numOfSale: line.quantity } },
      { session, arrayFilters: [{ "v.sku": line.variantSku }] },
    );
    if (result.modifiedCount !== 1) throw new ApiError(409, "The stock reservation is no longer available");
    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "confirm", quantity: line.quantity, orderId }],
      { session },
    );
  }
}

// Releases a reservation without touching sellable stock (order cancelled before payment).
export async function releaseReservation(lines: StockLine[], orderId: string, session: ClientSession) {
  for (const line of lines) {
    const result = await Product.updateOne(
      { _id: line.productId, variants: { $elemMatch: { sku: line.variantSku, reserved: { $gte: line.quantity } } } },
      { $inc: { "variants.$[v].reserved": -line.quantity } },
      { session, arrayFilters: [{ "v.sku": line.variantSku }] },
    );
    if (result.modifiedCount !== 1) throw new ApiError(409, "The stock reservation is no longer available");
    await InventoryMovement.create(
      [{ productId: line.productId, variantSku: line.variantSku, type: "release", quantity: line.quantity, orderId }],
      { session },
    );
  }
}
