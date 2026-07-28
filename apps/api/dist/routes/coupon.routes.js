import { Router } from "express";
import { authenticate, optionalAuthenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCouponHandler, listCouponsHandler, validateCouponHandler, couponSchema, validateCouponSchema, } from "../controllers/coupon.controller.js";
export const couponRouter = Router();
couponRouter.post("/validate", optionalAuthenticate, validateBody(validateCouponSchema), asyncHandler(validateCouponHandler));
couponRouter.get("/", authenticate, requirePermission("marketing.manage"), asyncHandler(listCouponsHandler));
couponRouter.post("/", authenticate, requirePermission("marketing.manage"), validateBody(couponSchema), asyncHandler(createCouponHandler));
//# sourceMappingURL=coupon.routes.js.map