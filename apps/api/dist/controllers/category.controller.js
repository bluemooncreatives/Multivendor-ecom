import { z } from "zod";
import { Category, Brand } from "../models/Category.js";
import { ApiError } from "../middleware/errorHandler.js";
export const categorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(120),
    parentId: z.string().nullable().optional(),
    iconUrl: z.string().url().optional(),
    bannerUrl: z.string().url().optional(),
    featured: z.boolean().optional(),
    order: z.number().int().optional(),
});
export const brandSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(120),
    logoUrl: z.string().url().optional(),
});
async function resolveLevel(parentId) {
    if (!parentId)
        return 0;
    const parent = await Category.findById(parentId);
    if (!parent)
        throw new ApiError(400, "Parent category not found");
    if (parent.level >= 2)
        throw new ApiError(400, "Category nesting is limited to 3 levels");
    return (parent.level + 1);
}
export async function listCategoriesHandler(_req, res) {
    const categories = await Category.find({ active: true }).sort({ level: 1, order: 1 });
    res.json({ items: categories });
}
export async function createCategoryHandler(req, res) {
    const level = await resolveLevel(req.body.parentId);
    const category = await Category.create({ ...req.body, level });
    res.status(201).json(category);
}
export async function updateCategoryHandler(req, res) {
    const level = req.body.parentId !== undefined ? await resolveLevel(req.body.parentId) : undefined;
    const category = await Category.findByIdAndUpdate(req.params.id, { ...req.body, ...(level !== undefined ? { level } : {}) }, { new: true });
    if (!category)
        throw new ApiError(404, "Category not found");
    res.json(category);
}
export async function deleteCategoryHandler(req, res) {
    const hasChildren = await Category.exists({ parentId: req.params.id });
    if (hasChildren)
        throw new ApiError(409, "Remove or reassign child categories first");
    const deleted = await Category.findByIdAndUpdate(req.params.id, { active: false });
    if (!deleted)
        throw new ApiError(404, "Category not found");
    res.status(204).send();
}
export async function listBrandsHandler(_req, res) {
    const brands = await Brand.find({ active: true }).sort({ name: 1 });
    res.json({ items: brands });
}
export async function createBrandHandler(req, res) {
    const brand = await Brand.create(req.body);
    res.status(201).json(brand);
}
//# sourceMappingURL=category.controller.js.map