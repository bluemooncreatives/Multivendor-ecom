import type { Request, Response } from "express";
import { getSearchSuggestions, getTopSearches } from "../services/search.service.js";

export async function suggestionsHandler(req: Request, res: Response) {
  const q = String(req.query.q ?? "");
  res.json(await getSearchSuggestions(q));
}

export async function popularSearchesHandler(_req: Request, res: Response) {
  res.json({ items: await getTopSearches(10) });
}

// Admin report. `zeroResults=true` surfaces demand the catalog cannot satisfy —
// the most actionable signal for what to stock next.
export async function searchReportHandler(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const items = await getTopSearches(limit, req.query.zeroResults === "true");
  res.json({ items });
}
