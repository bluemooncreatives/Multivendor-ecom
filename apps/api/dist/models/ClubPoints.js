import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
// Immutable ledger for the club-points loyalty add-on (mirrors WalletTransaction's
// append-only pattern). User.clubPoints is a cached running total for fast reads.
const clubPointTransactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true }, // signed
    reason: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    idempotencyKey: { type: String, required: true, unique: true },
}, { timestamps: true });
withJsonId(clubPointTransactionSchema);
export const ClubPointTransaction = model("ClubPointTransaction", clubPointTransactionSchema);
//# sourceMappingURL=ClubPoints.js.map