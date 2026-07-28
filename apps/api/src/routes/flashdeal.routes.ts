import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listActiveFlashDealsHandler,
  getFlashDealHandler,
  listAdminFlashDealsHandler,
  createFlashDealHandler,
  updateFlashDealHandler,
  deleteFlashDealHandler,
  flashDealSchema,
} from "../controllers/flashdeal.controller.js";

export const flashDealRouter = Router();

flashDealRouter.get("/", asyncHandler(listActiveFlashDealsHandler));
flashDealRouter.get("/:id", asyncHandler(getFlashDealHandler));
flashDealRouter.get("/admin/all", authenticate, requirePermission("marketing.manage"), asyncHandler(listAdminFlashDealsHandler));
flashDealRouter.post(
  "/admin",
  authenticate,
  requirePermission("marketing.manage"),
  validateBody(flashDealSchema),
  asyncHandler(createFlashDealHandler),
);
flashDealRouter.patch(
  "/admin/:id",
  authenticate,
  requirePermission("marketing.manage"),
  validateBody(flashDealSchema.partial()),
  asyncHandler(updateFlashDealHandler),
);
flashDealRouter.delete("/admin/:id", authenticate, requirePermission("marketing.manage"), asyncHandler(deleteFlashDealHandler));
