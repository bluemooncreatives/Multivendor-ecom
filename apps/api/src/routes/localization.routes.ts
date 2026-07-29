import { Router } from "express";
import { Language, Currency, Country } from "../models/Localization.js";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  languageSchema,
  currencySchema,
  countrySchema,
  createLanguageHandler,
  updateLanguageHandler,
  deleteLanguageHandler,
  createCurrencyHandler,
  updateCurrencyHandler,
  deleteCurrencyHandler,
  createCountryHandler,
  updateCountryHandler,
  deleteCountryHandler,
  getTranslationsHandler,
  listTranslationsHandler,
  saveTranslationsHandler,
  translationsSchema,
  copyTranslationsHandler,
  copyTranslationsSchema,
} from "../controllers/localization.controller.js";

export const localizationRouter = Router();

localizationRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    res.json({ items: await Language.find({ active: true }) });
  }),
);
localizationRouter.get(
  "/currencies",
  asyncHandler(async (_req, res) => {
    res.json({ items: await Currency.find({ active: true }) });
  }),
);
localizationRouter.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    res.json({ items: await Country.find({ active: true }) });
  }),
);

// Public: the web app merges these overrides over its bundled message files.
localizationRouter.get("/translations/:code", asyncHandler(getTranslationsHandler));

const manage = [authenticate, requirePermission("settings.manage")] as const;

// Translation editor
localizationRouter.get("/admin/translations", ...manage, asyncHandler(listTranslationsHandler));
localizationRouter.put("/admin/translations", ...manage, validateBody(translationsSchema), asyncHandler(saveTranslationsHandler));
localizationRouter.post(
  "/admin/translations/copy",
  ...manage,
  validateBody(copyTranslationsSchema),
  asyncHandler(copyTranslationsHandler),
);

localizationRouter.post("/admin/languages", ...manage, validateBody(languageSchema), asyncHandler(createLanguageHandler));
localizationRouter.patch("/admin/languages/:id", ...manage, validateBody(languageSchema.partial()), asyncHandler(updateLanguageHandler));
localizationRouter.delete("/admin/languages/:id", ...manage, asyncHandler(deleteLanguageHandler));

localizationRouter.post("/admin/currencies", ...manage, validateBody(currencySchema), asyncHandler(createCurrencyHandler));
localizationRouter.patch("/admin/currencies/:id", ...manage, validateBody(currencySchema.partial()), asyncHandler(updateCurrencyHandler));
localizationRouter.delete("/admin/currencies/:id", ...manage, asyncHandler(deleteCurrencyHandler));

localizationRouter.post("/admin/countries", ...manage, validateBody(countrySchema), asyncHandler(createCountryHandler));
localizationRouter.patch("/admin/countries/:id", ...manage, validateBody(countrySchema.partial()), asyncHandler(updateCountryHandler));
localizationRouter.delete("/admin/countries/:id", ...manage, asyncHandler(deleteCountryHandler));
