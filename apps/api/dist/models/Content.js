import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const pageSchema = new Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    seoTitle: String,
    seoDescription: String,
    published: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(pageSchema);
export const Page = model("Page", pageSchema);
const policySchema = new Schema({
    type: { type: String, enum: ["privacy", "terms", "refund", "shipping", "seller_agreement"], required: true, unique: true },
    body: { type: String, required: true },
}, { timestamps: true });
withJsonId(policySchema);
export const Policy = model("Policy", policySchema);
const sliderSchema = new Schema({
    imageUrl: { type: String, required: true },
    linkUrl: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(sliderSchema);
export const Slider = model("Slider", sliderSchema);
const bannerSchema = new Schema({
    imageUrl: { type: String, required: true },
    linkUrl: String,
    placement: { type: String, enum: ["home_top", "home_middle", "category", "checkout"], required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(bannerSchema);
export const Banner = model("Banner", bannerSchema);
const homeCategorySchema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
withJsonId(homeCategorySchema);
export const HomeCategory = model("HomeCategory", homeCategorySchema);
const linkSchema = new Schema({
    label: { type: String, required: true },
    url: { type: String, required: true },
    placement: { type: String, enum: ["header", "footer"], required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
withJsonId(linkSchema);
export const Link = model("Link", linkSchema);
//# sourceMappingURL=Content.js.map