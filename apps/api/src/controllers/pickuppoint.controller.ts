import type { Request, Response } from "express";
import { z } from "zod";
import { PickupPoint } from "../models/Marketing.js";
import { ApiError } from "../middleware/errorHandler.js";

export const pickupPointSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().optional(),
});

export async function listActivePickupPointsHandler(_req: Request, res: Response) {
  res.json({ items: await PickupPoint.find({ active: true }).sort({ city: 1 }) });
}

export async function listAdminPickupPointsHandler(_req: Request, res: Response) {
  res.json({ items: await PickupPoint.find().sort({ city: 1 }) });
}

export async function createPickupPointHandler(req: Request, res: Response) {
  const point = await PickupPoint.create(req.body);
  res.status(201).json(point);
}

export async function updatePickupPointHandler(req: Request, res: Response) {
  const point = await PickupPoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!point) throw new ApiError(404, "Pickup point not found");
  res.json(point);
}

export async function deletePickupPointHandler(req: Request, res: Response) {
  const deleted = await PickupPoint.findByIdAndUpdate(req.params.id, { active: false });
  if (!deleted) throw new ApiError(404, "Pickup point not found");
  res.status(204).send();
}
