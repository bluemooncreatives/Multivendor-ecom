import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const languageSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // "en", "hi", "ar"
    name: { type: String, required: true },
    rtl: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(languageSchema);
export const Language = model("Language", languageSchema);

const currencySchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // "INR", "USD"
    name: { type: String, required: true, default: "" },
    symbol: { type: String, required: true },
    rateToBase: { type: Number, required: true, default: 1 }, // base = INR
    decimals: { type: Number, default: 2, min: 0, max: 4 },
    // Where the symbol sits relative to the amount: ₹100 vs 100₹.
    symbolPosition: { type: String, enum: ["before", "after"], default: "before" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(currencySchema);
export const Currency = model("Currency", currencySchema);

// Per-language UI string overrides, edited through the admin translation editor.
// The web app ships static JSON as the baseline; rows here take precedence, so an
// operator can retranslate a string without a redeploy.
const translationSchema = new Schema(
  {
    languageCode: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true, default: "" },
  },
  { timestamps: true },
);

translationSchema.index({ languageCode: 1, key: 1 }, { unique: true });
withJsonId(translationSchema);
export const Translation = model("Translation", translationSchema);

const countrySchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // ISO-3166 alpha-2
    name: { type: String, required: true },
    defaultCurrency: { type: String, default: "INR" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

withJsonId(countrySchema);
export const Country = model("Country", countrySchema);
