import { Router } from "express";
import { z } from "zod";
import { authenticate, optionalAuthenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCouponHandler,
  listCouponsHandler,
  validateCouponHandler,
  updateCouponHandler,
  deleteCouponHandler,
  getCouponUsageHandler,
  couponSchema,
  validateCouponSchema,
} from "../controllers/coupon.controller.js";

export const couponRouter = Router();

couponRouter.post("/validate", optionalAuthenticate, validateBody(validateCouponSchema), asyncHandler(validateCouponHandler));
couponRouter.get("/", authenticate, requirePermission("marketing.manage"), asyncHandler(listCouponsHandler));
couponRouter.post(
  "/",
  authenticate,
  requirePermission("marketing.manage"),
  validateBody(couponSchema),
  asyncHandler(createCouponHandler),
);
couponRouter.patch(
  "/:id",
  authenticate,
  requirePermission("marketing.manage"),
  validateBody(couponSchema.partial().extend({ active: z.boolean().optional() })),
  asyncHandler(updateCouponHandler),
);
couponRouter.delete("/:id", authenticate, requirePermission("marketing.manage"), asyncHandler(deleteCouponHandler));
couponRouter.get("/:id/usage", authenticate, requirePermission("marketing.manage"), asyncHandler(getCouponUsageHandler));
