import type { Request, Response } from "express";
import { z } from "zod";
import * as posService from "../services/pos.service.js";
import { Addon } from "../models/Settings.js";
import { Order } from "../models/Order.js";
import { streamOrderInvoice } from "../services/invoice.service.js";
import { ApiError } from "../middleware/errorHandler.js";

export const posSaleSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string(),
          variantSku: z.string(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1),
    // An admin operator names the seller being sold on behalf of; omitted, the
    // sale is of admin-owned In-House stock.
    sellerId: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    walkIn: z
      .object({
        name: z.string().min(1).max(120),
        phone: z.string().min(6).max(20),
        email: z.string().email().optional(),
        address: z.string().max(200).optional(),
        city: z.string().max(80).optional(),
        postalCode: z.string().max(20).optional(),
        country: z.string().max(80).optional(),
      })
      .nullable()
      .optional(),
    discount: z.number().min(0).default(0),
    shippingCost: z.number().min(0).default(0),
    paymentType: z.enum(["cash", "card", "wallet", "manual"]).default("cash"),
  })
  .refine((v) => v.customerId || v.walkIn, {
    message: "Record the customer, or their name and phone for a walk-in",
    path: ["walkIn"],
  });

/** POS is an add-on; selling through it while it is switched off should fail. */
async function assertPosEnabled() {
  const addon = await Addon.findOne({ key: "pos" });
  if (!addon?.enabled) throw new ApiError(403, "The point of sale module is not enabled");
}

function isAdminOperator(req: Request): boolean {
  return req.user!.role === "admin" || req.user!.role === "staff";
}

export async function createPosSaleHandler(req: Request, res: Response) {
  await assertPosEnabled();

  const admin = isAdminOperator(req);
  // A seller operator can only ever sell their own stock, whatever sellerId the
  // request claims; only an admin may name a different vendor.
  const sellerId = admin ? (req.body.sellerId ?? null) : req.user!.id;

  const order = await posService.createPosSale({
    sellerId,
    operatorId: req.user!.id,
    allowAnySeller: admin,
    lines: req.body.items,
    customerId: req.body.customerId,
    walkIn: req.body.walkIn,
    discount: req.body.discount,
    shippingCost: req.body.shippingCost,
    paymentType: req.body.paymentType,
  });

  res.status(201).json(order);
}

export async function searchPosProductsHandler(req: Request, res: Response) {
  await assertPosEnabled();

  const admin = isAdminOperator(req);
  const items = await posService.searchPosProducts(String(req.query.q ?? ""), admin ? null : req.user!.id, admin);
  res.json({ items });
}

/** Counter receipt for a completed sale. */
export async function posReceiptHandler(req: Request, res: Response) {
  const admin = isAdminOperator(req);
  const filter = admin ? { _id: req.params.id } : { _id: req.params.id, "details.sellerId": req.user!.id };

  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, "Sale not found");

  await streamOrderInvoice(order, res, { variant: admin ? "admin" : "seller", sellerId: req.user!.id });
}
