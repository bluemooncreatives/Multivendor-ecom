import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  shopSchema,
  getMyShopHandler,
  createOrUpdateShopHandler,
  getPublicShopHandler,
  getShopBySellerIdHandler,
  getSellerLedgerSummaryHandler,
  listSellerLedgerHandler,
  createWithdrawRequestHandler,
  listMyWithdrawRequestsHandler,
  withdrawRequestSchema,
  fulfillOrderItemHandler,
  fulfillmentSchema,
  applyForShopVerificationHandler,
  getVerificationFormHandler,
  shopVerificationSchema,
} from "../controllers/seller.controller.js";

export const sellerRouter = Router();

sellerRouter.get("/shop", authenticate, requireRole("seller"), asyncHandler(getMyShopHandler));
sellerRouter.put("/shop", authenticate, requireRole("seller"), validateBody(shopSchema), asyncHandler(createOrUpdateShopHandler));
// The admin-composed field list the seller's verification page renders.
sellerRouter.get(
  "/shop/verification-form",
  authenticate,
  requireRole("seller"),
  asyncHandler(getVerificationFormHandler),
);
sellerRouter.post(
  "/shop/verification",
  authenticate,
  requireRole("seller"),
  validateBody(shopVerificationSchema),
  asyncHandler(applyForShopVerificationHandler),
);
sellerRouter.get("/shops/:slug", asyncHandler(getPublicShopHandler));
sellerRouter.get("/shops/by-seller/:sellerId", asyncHandler(getShopBySellerIdHandler));

sellerRouter.get("/ledger/summary", authenticate, requireRole("seller"), asyncHandler(getSellerLedgerSummaryHandler));
sellerRouter.get("/ledger", authenticate, requireRole("seller"), asyncHandler(listSellerLedgerHandler));

sellerRouter.post(
  "/withdrawals",
  authenticate,
  requireRole("seller"),
  validateBody(withdrawRequestSchema),
  asyncHandler(createWithdrawRequestHandler),
);
sellerRouter.get("/withdrawals", authenticate, requireRole("seller"), asyncHandler(listMyWithdrawRequestsHandler));

sellerRouter.patch(
  "/orders/:orderId/fulfillment",
  authenticate,
  requireRole("seller"),
  validateBody(fulfillmentSchema),
  asyncHandler(fulfillOrderItemHandler),
);
