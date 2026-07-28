import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const subscriberSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
}, { timestamps: true });
withJsonId(subscriberSchema);
export const Subscriber = model("Subscriber", subscriberSchema);
const pickupPointSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: String,
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(pickupPointSchema);
export const PickupPoint = model("PickupPoint", pickupPointSchema);
const searchSchema = new Schema({
    query: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resultCount: { type: Number, default: 0 },
}, { timestamps: true });
withJsonId(searchSchema);
export const Search = model("Search", searchSchema);
//# sourceMappingURL=Marketing.js.map