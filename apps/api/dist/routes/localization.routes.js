import { Router } from "express";
import { Language, Currency, Country } from "../models/Localization.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const localizationRouter = Router();
localizationRouter.get("/languages", asyncHandler(async (_req, res) => {
    res.json({ items: await Language.find({ active: true }) });
}));
localizationRouter.get("/currencies", asyncHandler(async (_req, res) => {
    res.json({ items: await Currency.find({ active: true }) });
}));
localizationRouter.get("/countries", asyncHandler(async (_req, res) => {
    res.json({ items: await Country.find({ active: true }) });
}));
//# sourceMappingURL=localization.routes.js.map