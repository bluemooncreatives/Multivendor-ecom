import type { Request, Response } from "express";
import { z } from "zod";
import { Language, Currency, Country } from "../models/Localization.js";
import { ApiError } from "../middleware/errorHandler.js";

export const languageSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string().min(1),
  rtl: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function createLanguageHandler(req: Request, res: Response) {
  res.status(201).json(await Language.create(req.body));
}
export async function updateLanguageHandler(req: Request, res: Response) {
  const doc = await Language.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Language not found");
  res.json(doc);
}
export async function deleteLanguageHandler(req: Request, res: Response) {
  const doc = await Language.findByIdAndUpdate(req.params.id, { active: false });
  if (!doc) throw new ApiError(404, "Language not found");
  res.status(204).send();
}

export const currencySchema = z.object({
  code: z.string().min(3).max(3),
  symbol: z.string().min(1),
  rateToBase: z.number().min(0),
  active: z.boolean().optional(),
});

export async function createCurrencyHandler(req: Request, res: Response) {
  res.status(201).json(await Currency.create(req.body));
}
export async function updateCurrencyHandler(req: Request, res: Response) {
  const doc = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Currency not found");
  res.json(doc);
}
export async function deleteCurrencyHandler(req: Request, res: Response) {
  const doc = await Currency.findByIdAndUpdate(req.params.id, { active: false });
  if (!doc) throw new ApiError(404, "Currency not found");
  res.status(204).send();
}

export const countrySchema = z.object({
  code: z.string().min(2).max(2),
  name: z.string().min(1),
  defaultCurrency: z.string().optional(),
  active: z.boolean().optional(),
});

export async function createCountryHandler(req: Request, res: Response) {
  res.status(201).json(await Country.create(req.body));
}
export async function updateCountryHandler(req: Request, res: Response) {
  const doc = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) throw new ApiError(404, "Country not found");
  res.json(doc);
}
export async function deleteCountryHandler(req: Request, res: Response) {
  const doc = await Country.findByIdAndUpdate(req.params.id, { active: false });
  if (!doc) throw new ApiError(404, "Country not found");
  res.status(204).send();
}
