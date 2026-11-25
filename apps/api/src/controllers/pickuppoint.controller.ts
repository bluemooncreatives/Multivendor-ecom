import type { Request, Response } from "express";
import { z } from "zod";
import { PickupPoint } from "../models/Marketing.js";
import { ApiError } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { BusinessSetting } from "../models/Settings.js";
import { getManagedPickupPoint, pickupScope, pickupOrderView } from "../services/pickuppoint.service.js";
import { inventoryStatus } from "../services/order-state.js";
import { awardClubPointsForOrder } from "../services/clubpoints.service.js";
import { queueOrderSms } from "../services/order-sms.service.js";

export const pickupPointSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  phone: z.string().optional(),
  staffId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  active: z.boolean().optional(),
});

export async function listActivePickupPointsHandler(_req: Request, res: Response) {
  const setting = await BusinessSetting.findOne({ key: "business" }, { activation: 1 });
  res.json({ items: setting?.activation?.pickupPoint === false ? [] : await PickupPoint.find({ active: true }).select("-staffId").sort({ city: 1 }) });
}

export async function listAdminPickupPointsHandler(req: Request, res: Response) {
  res.json({ items: await PickupPoint.find(pickupScope(req.user!)).sort({ city: 1 }) });
}

async function validateStaff(req: Request) {
  if (req.body.staffId === undefined) return;
  if (req.user!.role !== "admin") throw new ApiError(403, "Only admins can assign pickup staff");
  if (req.body.staffId && !(await User.exists({ _id: req.body.staffId, role: "staff", banned: false }))) {
    throw new ApiError(400, "Select an active staff account");
  }
}

export async function createPickupPointHandler(req: Request, res: Response) {
  await validateStaff(req);
  const point = await PickupPoint.create({ ...req.body, ...(req.user!.role === "staff" ? { staffId: req.user!.id } : {}) });
  res.status(201).json(point);
}

export async function updatePickupPointHandler(req: Request, res: Response) {
  await validateStaff(req);
  const point = await PickupPoint.findOneAndUpdate({ _id: req.params.id, ...pickupScope(req.user!) }, req.body, { new: true, runValidators: true });
  if (!point) throw new ApiError(404, "Pickup point not found");
  res.json(point);
}

export async function deletePickupPointHandler(req: Request, res: Response) {
  const deleted = await PickupPoint.findOneAndUpdate({ _id: req.params.id, ...pickupScope(req.user!) }, { active: false });
  if (!deleted) throw new ApiError(404, "Pickup point not found");
  res.status(204).send();
}

export const pickupFulfillmentSchema = z.object({
  sellerId: z.string().regex(/^[a-f\d]{24}$/i).nullable(),
  status: z.enum(["processing", "shipped", "delivered"]),
});

export async function fulfillPickupShipmentHandler(req: Request, res: Response) {
  const pointId = String(req.params.id);
  const session = await mongoose.startSession();
  try {
    let result: ReturnType<typeof pickupOrderView> | undefined;
    await session.withTransaction(async () => {
      await getManagedPickupPoint(pointId, req.user!, session);
      const order = await Order.findOne({ _id: req.params.orderId, "details.pickupPointId": pointId }).session(session);
      if (!order) throw new ApiError(404, "Order not found");
      if (inventoryStatus(order) !== "confirmed" || ["cancelled", "refunded"].includes(order.status)) throw new ApiError(409, "Order is not available for fulfillment");
      const detail = order.details.find((d) => String(d.pickupPointId) === pointId && String(d.sellerId) === String(req.body.sellerId));
      if (!detail) throw new ApiError(404, "Shipment not found at this pickup point");
      const sequence = ["confirmed", "processing", "shipped", "delivered"];
      if (!sequence.includes(detail.status) || sequence.indexOf(req.body.status) < sequence.indexOf(detail.status)) throw new ApiError(409, "Fulfillment cannot move backwards");
      detail.status = req.body.status;
      if (detail.status === "delivered") detail.deliveredAt ??= new Date();
      const active = order.details.filter((d) => !["cancelled", "refunded"].includes(d.status));
      if (active.every((d) => d.status === "delivered")) order.status = "delivered";
      else if (active.some((d) => ["shipped", "delivered"].includes(d.status))) order.status = "shipped";
      else if (active.some((d) => d.status === "processing")) order.status = "processing";
      order.deliveryViewed = false;
      await order.save({ session });
      await queueOrderSms(order, "delivery", session, order.details.indexOf(detail));
      await awardClubPointsForOrder(String(order._id), session);
      result = pickupOrderView(order, pointId);
    });
    res.json(result);
  } finally { await session.endSession(); }
}
