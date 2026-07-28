import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
// Immutable stock ledger: every reservation/confirmation/release/restock is a row.
// Lets us reconstruct exactly why a variant's stock is what it is (legacy had none).
const inventoryMovementSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantSku: { type: String, required: true },
    type: { type: String, enum: ["reserve", "confirm", "release", "restock", "manual"], required: true },
    quantity: { type: Number, required: true }, // signed
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    note: String,
}, { timestamps: true });
inventoryMovementSchema.index({ productId: 1, variantSku: 1, createdAt: -1 });
withJsonId(inventoryMovementSchema);
export const InventoryMovement = model("InventoryMovement", inventoryMovementSchema);
// Immutable commission/settlement ledger per seller — the authoritative source
// for "how much do we owe this seller", independent of any mutable balance field.
const sellerLedgerSchema = new Schema({
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    type: { type: String, enum: ["sale", "commission", "refund", "withdrawal", "adjustment"], required: true },
    amount: { type: Number, required: true }, // signed; positive = owed to seller
    note: String,
}, { timestamps: true });
sellerLedgerSchema.index({ sellerId: 1, createdAt: -1 });
withJsonId(sellerLedgerSchema);
export const SellerLedger = model("SellerLedger", sellerLedgerSchema);
const sellerWithdrawRequestSchema = new Schema({
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bank_transfer", "wallet", "manual"], required: true },
    bankDetails: Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    processedAt: Date,
    rejectionReason: String,
}, { timestamps: true });
withJsonId(sellerWithdrawRequestSchema);
export const SellerWithdrawRequest = model("SellerWithdrawRequest", sellerWithdrawRequestSchema);
//# sourceMappingURL=Ledger.js.map