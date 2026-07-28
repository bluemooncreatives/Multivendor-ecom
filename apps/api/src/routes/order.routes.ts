import { Router } from "express";
import { authenticate, optionalAuthenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkoutHandler,
  getOrderHandler,
  listMyOrdersHandler,
  listSellerOrdersHandler,
  cancelOrderHandler,
  checkoutSchema,
} from "../controllers/order.controller.js";

export const orderRouter = Router();

orderRouter.post("/checkout", optionalAuthenticate, validateBody(checkoutSchema), asyncHandler(checkoutHandler));
orderRouter.get("/mine", authenticate, asyncHandler(listMyOrdersHandler));
orderRouter.get("/seller", authenticate, requireRole("seller"), asyncHandler(listSellerOrdersHandler));
orderRouter.get("/:id", authenticate, asyncHandler(getOrderHandler));
orderRouter.post("/:id/cancel", authenticate, asyncHandler(cancelOrderHandler));
