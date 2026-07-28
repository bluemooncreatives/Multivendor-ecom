import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createReviewHandler, listProductReviewsHandler, listSellerReviewsHandler, replyReviewHandler, listAdminReviewsHandler, moderateReviewHandler, createReviewSchema, replyReviewSchema, moderateReviewSchema, } from "../controllers/review.controller.js";
export const reviewRouter = Router();
reviewRouter.get("/product/:productId", asyncHandler(listProductReviewsHandler));
reviewRouter.post("/", authenticate, validateBody(createReviewSchema), asyncHandler(createReviewHandler));
reviewRouter.get("/seller", authenticate, requireRole("seller"), asyncHandler(listSellerReviewsHandler));
reviewRouter.post("/:id/reply", authenticate, requireRole("seller"), validateBody(replyReviewSchema), asyncHandler(replyReviewHandler));
reviewRouter.get("/admin", authenticate, requirePermission("catalog.moderate"), asyncHandler(listAdminReviewsHandler));
reviewRouter.post("/admin/:id/moderate", authenticate, requirePermission("catalog.moderate"), validateBody(moderateReviewSchema), asyncHandler(moderateReviewHandler));
//# sourceMappingURL=review.routes.js.map