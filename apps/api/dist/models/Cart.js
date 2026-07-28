import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const cartItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });
// Keyed by userId (logged in) or guestId (UUID cookie); exactly one must be set.
// Price is NEVER stored here — it is always recomputed server-side at checkout.
const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true, sparse: true },
    guestId: { type: String, default: null, index: true, sparse: true },
    items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });
withJsonId(cartSchema);
export const Cart = model("Cart", cartSchema);
//# sourceMappingURL=Cart.js.map