import type { Request, Response } from "express";
import { z } from "zod";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { signDownloadToken, verifyDownloadToken } from "../services/digitalproduct.service.js";
import { ApiError } from "../middleware/errorHandler.js";

// Every digital item across the customer's *paid* orders, with a fresh
// request-download link per item (tokens are short-lived, not stored/reused).
export async function listMyDigitalPurchasesHandler(req: Request, res: Response) {
  const orders = await Order.find({ userId: req.user!.id, paymentStatus: "paid" });
  const productIds = [...new Set(orders.flatMap((o) => o.details.flatMap((d) => d.items.map((i) => String(i.productId)))))];
  const digitalProducts = await Product.find({ _id: { $in: productIds }, isDigital: true });
  const digitalIds = new Set(digitalProducts.map((p) => String(p._id)));

  const purchases = [];
  for (const order of orders) {
    for (const detail of order.details) {
      for (const item of detail.items) {
        if (digitalIds.has(String(item.productId))) {
          purchases.push({ orderId: order._id, orderCode: order.code, productId: item.productId, name: item.name });
        }
      }
    }
  }

  res.json({ items: purchases });
}

export const requestDownloadSchema = z.object({
  productId: z.string(),
  orderId: z.string(),
});

export async function requestDownloadHandler(req: Request, res: Response) {
  const { productId, orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, userId: req.user!.id, paymentStatus: "paid" });
  if (!order) throw new ApiError(404, "Order not found or not yet paid");

  const purchased = order.details.some((d) => d.items.some((i) => String(i.productId) === productId));
  if (!purchased) throw new ApiError(403, "This product was not purchased in that order");

  const product = await Product.findOne({ _id: productId, isDigital: true });
  if (!product?.digitalFileUrl) throw new ApiError(404, "No digital file available for this product");

  const token = signDownloadToken({ sub: req.user!.id, productId, orderId });
  res.json({ downloadUrl: `/api/v1/digital-products/download/${token}` });
}

export async function downloadHandler(req: Request, res: Response) {
  let payload;
  try {
    payload = verifyDownloadToken(String(req.params.token));
  } catch {
    throw new ApiError(400, "This download link is invalid or has expired");
  }

  const product = await Product.findById(payload.productId);
  if (!product?.digitalFileUrl) throw new ApiError(404, "File not found");

  res.redirect(product.digitalFileUrl);
}
