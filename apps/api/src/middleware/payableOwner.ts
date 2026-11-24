import type { Request, Response, NextFunction } from "express";
import { Order } from "../models/Order.js";
import { GatewayIntent } from "../models/GatewayIntent.js";
import { ApiError } from "./errorHandler.js";

export async function assertPayableOwner(req: Request) {
  const orderId = String(req.params.orderId);
  const guestId = req.header("x-guest-id");
  if (!req.user && !guestId) throw new ApiError(401, "A payment owner is required");
  const filter = req.user ? { userId: req.user.id } : { userId: null, guestId };
  if (await Order.exists({ _id: orderId, ...filter })) return;
  if (req.user && await GatewayIntent.exists({ _id: orderId, userId: req.user.id })) return;
  throw new ApiError(404, "Payment not found");
}

export function requirePayableOwner(req: Request, _res: Response, next: NextFunction) {
  assertPayableOwner(req).then(() => next(), next);
}
