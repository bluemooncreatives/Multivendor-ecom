import type { Request, Response } from "express";
import { z } from "zod";
import { CustomerProduct } from "../models/CustomerProduct.js";
import { ApiError } from "../middleware/errorHandler.js";

export const classifiedSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default("INR"),
  categoryId: z.string(),
  images: z.array(z.string().url()).default([]),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
});

export async function listClassifiedsHandler(req: Request, res: Response) {
  const { categoryId } = req.query as { categoryId?: string };
  const items = await CustomerProduct.find({
    status: "approved",
    ...(categoryId ? { categoryId } : {}),
  }).sort({ createdAt: -1 });
  res.json({ items });
}

export async function createClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.create({ ...req.body, userId: req.user!.id, status: "pending" });
  res.status(201).json(item);
}

export async function listMyClassifiedsHandler(req: Request, res: Response) {
  const items = await CustomerProduct.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json({ items });
}

export async function updateClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { ...req.body, status: "pending" },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}

export async function deleteClassifiedHandler(req: Request, res: Response) {
  const deleted = await CustomerProduct.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!deleted) throw new ApiError(404, "Listing not found");
  res.status(204).send();
}

export const moderateClassifiedSchema = z.object({ approved: z.boolean() });

export async function moderateClassifiedHandler(req: Request, res: Response) {
  const item = await CustomerProduct.findByIdAndUpdate(
    req.params.id,
    { status: req.body.approved ? "approved" : "rejected" },
    { new: true },
  );
  if (!item) throw new ApiError(404, "Listing not found");
  res.json(item);
}
