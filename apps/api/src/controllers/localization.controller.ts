import type { Request, Response } from "express";
import { z } from "zod";
import { Language, Currency, Country, Translation } from "../models/Localization.js";
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
  name: z.string().min(1).optional(),
  symbol: z.string().min(1),
  rateToBase: z.number().min(0),
  decimals: z.number().int().min(0).max(4).optional(),
  symbolPosition: z.enum(["before", "after"]).optional(),
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

// --- Translation editor -------------------------------------------------------

/**
 * Public: the overrides for one language, as a flat key/value map the web app
 * merges over its bundled messages. Only rows with a value are returned, so an
 * empty override never blanks out a shipped string.
 */
export async function getTranslationsHandler(req: Request, res: Response) {
  const rows = await Translation.find({ languageCode: String(req.params.code), value: { $ne: "" } }, { key: 1, value: 1 });
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function listTranslationsHandler(req: Request, res: Response) {
  const languageCode = String(req.query.code ?? "");
  if (!languageCode) throw new ApiError(400, "code is required");

  const search = req.query.q ? String(req.query.q).slice(0, 80) : null;
  const filter: Record<string, unknown> = { languageCode };
  if (search) {
    filter.$or = [{ key: { $regex: search, $options: "i" } }, { value: { $regex: search, $options: "i" } }];
  }

  res.json({ items: await Translation.find(filter).sort({ key: 1 }).limit(500) });
}

export const translationsSchema = z.object({
  languageCode: z.string().min(2).max(5),
  // The editor saves a whole page of rows at once rather than one request per row.
  entries: z.array(z.object({ key: z.string().min(1).max(200), value: z.string().max(2000) })).min(1).max(500),
});

export async function saveTranslationsHandler(req: Request, res: Response) {
  const { languageCode, entries } = req.body as z.infer<typeof translationsSchema>;

  const language = await Language.findOne({ code: languageCode });
  if (!language) throw new ApiError(404, "Language not found");

  await Translation.bulkWrite(
    entries.map((entry) => ({
      updateOne: {
        filter: { languageCode, key: entry.key },
        update: { $set: { value: entry.value } },
        upsert: true,
      },
    })),
  );

  res.json({ saved: entries.length });
}

/**
 * Copies every key from one language to another, leaving values blank where the
 * target has none. This is the legacy "copy translations" button: it seeds a new
 * language with the full key list so a translator has something to work through.
 */
export const copyTranslationsSchema = z.object({
  fromCode: z.string().min(2).max(5),
  toCode: z.string().min(2).max(5),
});

export async function copyTranslationsHandler(req: Request, res: Response) {
  const { fromCode, toCode } = req.body as z.infer<typeof copyTranslationsSchema>;
  if (fromCode === toCode) throw new ApiError(400, "Choose two different languages");

  const source = await Translation.find({ languageCode: fromCode }, { key: 1 });
  if (source.length === 0) throw new ApiError(404, "That language has no translation keys yet");

  await Translation.bulkWrite(
    source.map((row) => ({
      updateOne: {
        filter: { languageCode: toCode, key: row.key },
        // $setOnInsert only: an existing translation in the target language must
        // not be blanked out by the copy.
        update: { $setOnInsert: { value: "" } },
        upsert: true,
      },
    })),
  );

  res.json({ copied: source.length });
}
