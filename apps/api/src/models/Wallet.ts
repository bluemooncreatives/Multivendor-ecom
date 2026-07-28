import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const walletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true },
);

withJsonId(walletSchema);
export const Wallet = model("Wallet", walletSchema);

// Immutable ledger — every balance change is an append-only row, never edited.
// The legacy app only stored a mutable `balance` column with no audit trail.
const walletTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true }, // positive = credit, negative = debit
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    refType: { type: String, enum: ["order", "refund", "recharge", "withdrawal", "affiliate", "manual"] },
    refId: { type: Schema.Types.ObjectId, default: null },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

withJsonId(walletTransactionSchema);
export const WalletTransaction = model("WalletTransaction", walletTransactionSchema);

// Offline/manual wallet top-up: customer uploads a bank-transfer receipt, an
// admin approves it, and only then is the wallet credited (one-way state
// machine, same pattern as manual order payments and refund requests).
const walletRechargeRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    methodId: { type: Schema.Types.ObjectId, ref: "ManualPaymentMethod", required: true },
    proofUrl: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: String,
  },
  { timestamps: true },
);

withJsonId(walletRechargeRequestSchema);
export const WalletRechargeRequest = model("WalletRechargeRequest", walletRechargeRequestSchema);
