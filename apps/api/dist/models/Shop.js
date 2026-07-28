import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const shopSchema = new Schema({
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    logoUrl: String,
    bannerUrl: String,
    description: String,
    address: String,
    socialLinks: { type: Map, of: String, default: {} },
    verified: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    verificationDocs: { type: [String], default: [] },
}, { timestamps: true });
withJsonId(shopSchema);
export const Shop = model("Shop", shopSchema);
//# sourceMappingURL=Shop.js.map