import { z } from "zod";
import { Language, Currency, Country } from "../models/Localization.js";
import { ApiError } from "../middleware/errorHandler.js";
export const languageSchema = z.object({
    code: z.string().min(2).max(5),
    name: z.string().min(1),
    rtl: z.boolean().optional(),
    active: z.boolean().optional(),
});
export async function createLanguageHandler(req, res) {
    res.status(201).json(await Language.create(req.body));
}
export async function updateLanguageHandler(req, res) {
    const doc = await Language.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc)
        throw new ApiError(404, "Language not found");
    res.json(doc);
}
export async function deleteLanguageHandler(req, res) {
    const doc = await Language.findByIdAndUpdate(req.params.id, { active: false });
    if (!doc)
        throw new ApiError(404, "Language not found");
    res.status(204).send();
}
export const currencySchema = z.object({
    code: z.string().min(3).max(3),
    symbol: z.string().min(1),
    rateToBase: z.number().min(0),
    active: z.boolean().optional(),
});
export async function createCurrencyHandler(req, res) {
    res.status(201).json(await Currency.create(req.body));
}
export async function updateCurrencyHandler(req, res) {
    const doc = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc)
        throw new ApiError(404, "Currency not found");
    res.json(doc);
}
export async function deleteCurrencyHandler(req, res) {
    const doc = await Currency.findByIdAndUpdate(req.params.id, { active: false });
    if (!doc)
        throw new ApiError(404, "Currency not found");
    res.status(204).send();
}
export const countrySchema = z.object({
    code: z.string().min(2).max(2),
    name: z.string().min(1),
    defaultCurrency: z.string().optional(),
    active: z.boolean().optional(),
});
export async function createCountryHandler(req, res) {
    res.status(201).json(await Country.create(req.body));
}
export async function updateCountryHandler(req, res) {
    const doc = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc)
        throw new ApiError(404, "Country not found");
    res.json(doc);
}
export async function deleteCountryHandler(req, res) {
    const doc = await Country.findByIdAndUpdate(req.params.id, { active: false });
    if (!doc)
        throw new ApiError(404, "Country not found");
    res.status(204).send();
}
//# sourceMappingURL=localization.controller.js.map