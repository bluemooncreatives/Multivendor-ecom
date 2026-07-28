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
    published: z.boolean().optional(),
});
export async function getPageBySlugHandler(req, res) {
    const page = await Page.findOne({ slug: req.params.slug, published: true });
    if (!page)
        throw new ApiError(404, "Page not found");
    res.json(page);
}
export async function listPagesHandler(_req, res) {
    res.json({ items: await Page.find().sort({ title: 1 }) });
}
export async function createPageHandler(req, res) {
    const page = await Page.create(req.body);
    res.status(201).json(page);
}
export async function updatePageHandler(req, res) {
    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!page)
        throw new ApiError(404, "Page not found");
    res.json(page);
}
export async function deletePageHandler(req, res) {
    const deleted = await Page.findByIdAndDelete(req.params.id);
    if (!deleted)
        throw new ApiError(404, "Page not found");
    res.status(204).send();
}
// --- Policies (single doc per type) -----------------------------------------
const POLICY_TYPES = ["privacy", "terms", "refund", "shipping", "seller_agreement"];
export async function getPolicyHandler(req, res) {
    const type = req.params.type;
    if (!POLICY_TYPES.includes(type))
        throw new ApiError(404, "Unknown policy type");
    const policy = (await Policy.findOne({ type })) ?? { type, body: "" };
    res.json(policy);
}
export const upsertPolicySchema = z.object({ body: z.string().min(1) });
export async function upsertPolicyHandler(req, res) {
    const type = req.params.type;
    if (!POLICY_TYPES.includes(type))
        throw new ApiError(404, "Unknown policy type");
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
export async function listLinksHandler(req, res) {
    const { placement } = req.query;
    const links = await Link.find(placement ? { placement } : {}).sort({ order: 1 });
    res.json({ items: links });
}
export async function createLinkHandler(req, res) {
    const link = await Link.create(req.body);
    res.status(201).json(link);
}
export async function updateLinkHandler(req, res) {
    const link = await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!link)
        throw new ApiError(404, "Link not found");
    res.json(link);
}
export async function deleteLinkHandler(req, res) {
    const deleted = await Link.findByIdAndDelete(req.params.id);
    if (!deleted)
        throw new ApiError(404, "Link not found");
    res.status(204).send();
}
//# sourceMappingURL=cms.controller.js.map