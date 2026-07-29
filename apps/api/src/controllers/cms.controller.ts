import type { Request, Response } from "express";
import { z } from "zod";
import { Page, Policy, Link } from "../models/Content.js";
import { ApiError } from "../middleware/errorHandler.js";

// --- Pages -----------------------------------------------------------------

export const pageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  seoImageUrl: z.string().url().optional(),
  published: z.boolean().optional(),
});

export async function getPageBySlugHandler(req: Request, res: Response) {
  const page = await Page.findOne({ slug: req.params.slug, published: true });
  if (!page) throw new ApiError(404, "Page not found");
  res.json(page);
}

export async function listPagesHandler(_req: Request, res: Response) {
  res.json({ items: await Page.find().sort({ title: 1 }) });
}

// Public: published pages only, and only the fields the sitemap and any nav menu
// need — the body is fetched per page, not listed in bulk.
export async function listPublishedPagesHandler(_req: Request, res: Response) {
  res.json({
    items: await Page.find({ published: true }, { slug: 1, title: 1, updatedAt: 1 }).sort({ title: 1 }),
  });
}

export async function createPageHandler(req: Request, res: Response) {
  const page = await Page.create(req.body);
  res.status(201).json(page);
}

export async function updatePageHandler(req: Request, res: Response) {
  const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!page) throw new ApiError(404, "Page not found");
  res.json(page);
}

export async function deletePageHandler(req: Request, res: Response) {
  const deleted = await Page.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Page not found");
  res.status(204).send();
}

// --- Policies (single doc per type) -----------------------------------------

// Must stay in step with the Policy model's enum, and covers the five policy
// pages the storefront links to plus the seller agreement.
const POLICY_TYPES = ["privacy", "terms", "refund", "return", "shipping", "support", "seller_agreement"] as const;

export async function getPolicyHandler(req: Request, res: Response) {
  const type = req.params.type as (typeof POLICY_TYPES)[number];
  if (!POLICY_TYPES.includes(type)) throw new ApiError(404, "Unknown policy type");
  const policy = (await Policy.findOne({ type })) ?? { type, body: "" };
  res.json(policy);
}

export const upsertPolicySchema = z.object({ body: z.string().min(1) });

export async function upsertPolicyHandler(req: Request, res: Response) {
  const type = req.params.type as (typeof POLICY_TYPES)[number];
  if (!POLICY_TYPES.includes(type)) throw new ApiError(404, "Unknown policy type");
  const policy = await Policy.findOneAndUpdate({ type }, { type, body: req.body.body }, { upsert: true, new: true });
  res.json(policy);
}

// --- Footer / header links --------------------------------------------------

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  placement: z.enum(["header", "footer"]),
  order: z.number().int().optional(),
});

export async function listLinksHandler(req: Request, res: Response) {
  const { placement } = req.query as { placement?: string };
  const links = await Link.find(placement ? { placement } : {}).sort({ order: 1 });
  res.json({ items: links });
}

export async function createLinkHandler(req: Request, res: Response) {
  const link = await Link.create(req.body);
  res.status(201).json(link);
}

export async function updateLinkHandler(req: Request, res: Response) {
  const link = await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!link) throw new ApiError(404, "Link not found");
  res.json(link);
}

export async function deleteLinkHandler(req: Request, res: Response) {
  const deleted = await Link.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Link not found");
  res.status(204).send();
}
