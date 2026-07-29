import type { Request, Response } from "express";
import { z } from "zod";
import { Attribute, Color } from "../models/Category.js";
import { ApiError } from "../middleware/errorHandler.js";

export const attributeSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
  // Empty = available on every category, matching the cascade endpoints' $or.
  categoryIds: z.array(z.string()).default([]),
});

export async function listAttributesHandler(_req: Request, res: Response) {
  res.json({ items: await Attribute.find().sort({ name: 1 }) });
}

export async function createAttributeHandler(req: Request, res: Response) {
  const attribute = await Attribute.create(req.body);
  res.status(201).json(attribute);
}

export async function updateAttributeHandler(req: Request, res: Response) {
  const attribute = await Attribute.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!attribute) throw new ApiError(404, "Attribute not found");
  res.json(attribute);
}

export async function deleteAttributeHandler(req: Request, res: Response) {
  const deleted = await Attribute.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Attribute not found");
  res.status(204).send();
}

export const colorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  active: z.boolean().default(true),
});

export async function listColorsHandler(_req: Request, res: Response) {
  res.json({ items: await Color.find({ active: true }).sort({ name: 1 }) });
}

export async function createColorHandler(req: Request, res: Response) {
  const color = await Color.create(req.body);
  res.status(201).json(color);
}

export async function updateColorHandler(req: Request, res: Response) {
  const color = await Color.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!color) throw new ApiError(404, "Color not found");
  res.json(color);
}

export async function deleteColorHandler(req: Request, res: Response) {
  const deleted = await Color.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, "Color not found");
  res.status(204).send();
}
