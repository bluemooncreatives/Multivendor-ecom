import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  subscribeHandler,
  listSubscribersHandler,
  sendCampaignHandler,
  subscribeSchema,
  sendCampaignSchema,
} from "../controllers/newsletter.controller.js";

export const newsletterRouter = Router();

newsletterRouter.post("/subscribe", validateBody(subscribeSchema), asyncHandler(subscribeHandler));
newsletterRouter.get("/admin/subscribers", authenticate, requirePermission("marketing.manage"), asyncHandler(listSubscribersHandler));
newsletterRouter.post(
  "/admin/send",
  authenticate,
  requirePermission("marketing.manage"),
  validateBody(sendCampaignSchema),
  asyncHandler(sendCampaignHandler),
);
