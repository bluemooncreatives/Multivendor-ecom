import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
const languageSchema = new Schema({
    code: { type: String, required: true, unique: true }, // "en", "hi", "ar"
    name: { type: String, required: true },
    rtl: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(languageSchema);
export const Language = model("Language", languageSchema);
const currencySchema = new Schema({
    code: { type: String, required: true, unique: true }, // "INR", "USD"
    symbol: { type: String, required: true },
    rateToBase: { type: Number, required: true, default: 1 }, // base = INR
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(currencySchema);
export const Currency = model("Currency", currencySchema);
const countrySchema = new Schema({
    code: { type: String, required: true, unique: true }, // ISO-3166 alpha-2
    name: { type: String, required: true },
    defaultCurrency: { type: String, default: "INR" },
    active: { type: Boolean, default: true },
}, { timestamps: true });
withJsonId(countrySchema);
export const Country = model("Country", countrySchema);
//# sourceMappingURL=Localization.js.map