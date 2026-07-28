import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { SellerLedger } from "../models/Ledger.js";
import { calculateCommission } from "./commission.service.js";
import { reserveStock, confirmReservation } from "./inventory.service.js";
import { ApiError } from "../middleware/errorHandler.js";
// An in-person sale settles instantly (cash/card handled outside the app), so it
// skips the cart/address/coupon flow entirely but reuses the same reserve->confirm
// stock path and the same commission service as online checkout for consistency.
export async function createPosSale(sellerId, lines) {
    if (lines.length === 0)
        throw new ApiError(400, "At least one item is required");
    const session = await mongoose.startSession();
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            const orderId = new mongoose.Types.ObjectId();
            const items = [];
            const stockLines = [];
            let subtotal = 0;
            for (const line of lines) {
                const product = await Product.findOne({ _id: line.productId, sellerId }).session(session);
                if (!product)
                    throw new ApiError(404, "Product not found in your catalog");
                const variant = product.variants.find((v) => v.sku === line.variantSku);
                if (!variant)
                    throw new ApiError(404, "Variant not found");
                items.push({
                    productId: product._id,
                    variantSku: variant.sku,
                    name: product.name,
                    attributes: variant.attributes,
                    quantity: line.quantity,
                    unitPrice: variant.price,
                    imageUrl: variant.imageUrl ?? product.images[0],
                });
                subtotal += variant.price * line.quantity;
                stockLines.push({ productId: String(product._id), variantSku: variant.sku, quantity: line.quantity });
            }
            await reserveStock(stockLines, String(orderId), session);
            await confirmReservation(stockLines, String(orderId), session);
            const { rate, amount } = await calculateCommission(sellerId, subtotal);
            await SellerLedger.create([
                { sellerId, orderId, type: "sale", amount: subtotal, note: "POS sale" },
                { sellerId, orderId, type: "commission", amount: -amount, note: "Platform commission (POS)" },
            ], { session, ordered: true });
            const [order] = await Order.create([
                {
                    _id: orderId,
                    code: `POS-${orderId.toHexString()}`,
                    addressSnapshot: { line1: "In-store purchase", city: "-", state: "-", country: "-", postalCode: "-", phone: "-" },
                    details: [
                        {
                            sellerId,
                            items,
                            subtotal,
                            commissionRate: rate,
                            commissionAmount: amount,
                            shippingCost: 0,
                            status: "confirmed",
                        },
                    ],
                    grandTotal: subtotal,
                    currency: "INR",
                    paymentMethod: "manual",
                    paymentStatus: "paid",
                    status: "confirmed",
                    idempotencyKey: `pos:${randomUUID()}`,
                },
            ], { session });
            createdOrder = order;
        });
        return createdOrder;
    }
    finally {
        await session.endSession();
    }
}
//# sourceMappingURL=pos.service.js.map