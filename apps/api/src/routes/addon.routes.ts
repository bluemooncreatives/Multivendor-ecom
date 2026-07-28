import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  classifiedSchema,
  moderateClassifiedSchema,
  listClassifiedsHandler,
  createClassifiedHandler,
  listMyClassifiedsHandler,
  updateClassifiedHandler,
  deleteClassifiedHandler,
  moderateClassifiedHandler,
} from "../controllers/classified.controller.js";

import {
  getAffiliateConfigHandler,
  joinAffiliateHandler,
  getMyAffiliateHandler,
  listMyAffiliateEarningsHandler,
  createAffiliateWithdrawHandler,
  affiliateWithdrawSchema,
} from "../controllers/affiliate.controller.js";

import { getMyClubPointsHandler, listMyClubPointHistoryHandler } from "../controllers/clubpoints.controller.js";

import {
  refundRequestSchema,
  resolveRefundSchema,
  createRefundRequestHandler,
  listMyRefundRequestsHandler,
  listSellerRefundRequestsHandler,
  resolveRefundRequestHandler,
} from "../controllers/refund.controller.js";

import {
  listSellerPackagesHandler,
  listCustomerPackagesHandler,
  purchasePackageSchema,
  purchaseSellerPackageHandler,
  purchaseCustomerPackageHandler,
} from "../controllers/package.controller.js";

import { posSaleSchema, createPosSaleHandler } from "../controllers/pos.controller.js";

export const addonRouter = Router();

// --- Classified products (customer-to-customer listings) ---
addonRouter.get("/classifieds", asyncHandler(listClassifiedsHandler));
addonRouter.post("/classifieds", authenticate, validateBody(classifiedSchema), asyncHandler(createClassifiedHandler));
addonRouter.get("/classifieds/mine", authenticate, asyncHandler(listMyClassifiedsHandler));
addonRouter.patch("/classifieds/:id", authenticate, validateBody(classifiedSchema.partial()), asyncHandler(updateClassifiedHandler));
addonRouter.delete("/classifieds/:id", authenticate, asyncHandler(deleteClassifiedHandler));
addonRouter.post(
  "/classifieds/:id/moderate",
  authenticate,
  requirePermission("catalog.moderate"),
  validateBody(moderateClassifiedSchema),
  asyncHandler(moderateClassifiedHandler),
);

// --- Affiliate program ---
addonRouter.get("/affiliate/config", asyncHandler(getAffiliateConfigHandler));
addonRouter.post("/affiliate/join", authenticate, asyncHandler(joinAffiliateHandler));
addonRouter.get("/affiliate/me", authenticate, asyncHandler(getMyAffiliateHandler));
addonRouter.get("/affiliate/earnings", authenticate, asyncHandler(listMyAffiliateEarningsHandler));
addonRouter.post(
  "/affiliate/withdrawals",
  authenticate,
  validateBody(affiliateWithdrawSchema),
  asyncHandler(createAffiliateWithdrawHandler),
);

// --- Club points ---
addonRouter.get("/club-points/me", authenticate, asyncHandler(getMyClubPointsHandler));
addonRouter.get("/club-points/history", authenticate, asyncHandler(listMyClubPointHistoryHandler));

// --- Refund requests ---
addonRouter.post("/refunds", authenticate, validateBody(refundRequestSchema), asyncHandler(createRefundRequestHandler));
addonRouter.get("/refunds/mine", authenticate, asyncHandler(listMyRefundRequestsHandler));
addonRouter.get("/refunds/seller", authenticate, requireRole("seller"), asyncHandler(listSellerRefundRequestsHandler));
addonRouter.post(
  "/refunds/:id/resolve",
  authenticate,
  requirePermission("orders.manage"),
  validateBody(resolveRefundSchema),
  asyncHandler(resolveRefundRequestHandler),
);

// --- Seller subscription / customer packages ---
addonRouter.get("/packages/seller", asyncHandler(listSellerPackagesHandler));
addonRouter.get("/packages/customer", asyncHandler(listCustomerPackagesHandler));
addonRouter.post(
  "/packages/seller/purchase",
  authenticate,
  requireRole("seller"),
  validateBody(purchasePackageSchema),
  asyncHandler(purchaseSellerPackageHandler),
);
addonRouter.post(
  "/packages/customer/purchase",
  authenticate,
  validateBody(purchasePackageSchema),
  asyncHandler(purchaseCustomerPackageHandler),
);

// --- POS (seller point-of-sale) ---
addonRouter.post("/pos/sales", authenticate, requireRole("seller"), validateBody(posSaleSchema), asyncHandler(createPosSaleHandler));
