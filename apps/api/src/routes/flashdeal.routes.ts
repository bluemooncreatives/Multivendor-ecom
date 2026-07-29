import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listActiveFlashDealsHandler,
  getFlashDealHandler,
  getFlashDealBySlugHandler,
  listAdminFlashDealsHandler,
  createFlashDealHandler,
  updateFlashDealHandler,
  deleteFlashDealHandler,
  flashDealSchema,
} from "../controllers/flashdeal.controller.js";

export const flashDealRouter = Router();

flashDealRouter.get("/", asyncHandler(listActiveFlashDealsHandler));
// Registered before /:id so "slug" is not swallowed by the id matcher.
flashDealRouter.get("/slug/:slug", asyncHandler(getFlashDealBySlugHandler));
flashDealRouter.get("/:id", asyncHandler(getFlashDealHandler));
flashDealRouter.get("/admin/all", authenticate, requirePermission("flashdeals.manage"), asyncHandler(listAdminFlashDealsHandler));
flashDealRouter.post(
  "/admin",
  authenticate,
  requirePermission("flashdeals.manage"),
  validateBody(flashDealSchema),
  asyncHandler(createFlashDealHandler),
);
flashDealRouter.patch(
  "/admin/:id",
  authenticate,
  requirePermission("flashdeals.manage"),
  validateBody(flashDealSchema.partial()),
  asyncHandler(updateFlashDealHandler),
);
flashDealRouter.delete("/admin/:id", authenticate, requirePermission("flashdeals.manage"), asyncHandler(deleteFlashDealHandler));
