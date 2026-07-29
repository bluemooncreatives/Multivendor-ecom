import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  classifiedSchema,
  moderateClassifiedSchema,
  listClassifiedsHandler,
  getClassifiedBySlugHandler,
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
  listMyAffiliateWithdrawalsHandler,
  listMyReferralsHandler,
  getAffiliatePaymentSettingsHandler,
  updateAffiliatePaymentSettingsHandler,
  affiliatePaymentSettingsSchema,
  affiliateConfigSchema,
  updateAffiliateConfigHandler,
  listAffiliateUsersHandler,
  getAffiliateUserHandler,
  moderateAffiliateSchema,
  moderateAffiliateUserHandler,
  listAffiliateWithdrawalsHandler,
  resolveAffiliateWithdrawSchema,
  resolveAffiliateWithdrawHandler,
  listAffiliatePaymentsHandler,
  payAffiliateHandler,
  payAffiliateSchema,
  listReferredUsersHandler,
} from "../controllers/affiliate.controller.js";

import {
  getMyClubPointsHandler,
  listMyClubPointHistoryHandler,
  convertClubPointsSchema,
  convertClubPointsHandler,
  clubPointConfigSchema,
  getClubPointConfigHandler,
  updateClubPointConfigHandler,
  listProductClubPointsHandler,
  setProductClubPointsSchema,
  setProductClubPointsHandler,
  setAllProductClubPointsSchema,
  setAllProductClubPointsHandler,
  listClubPointUsersHandler,
  getUserClubPointDetailHandler,
} from "../controllers/clubpoints.controller.js";

import {
  refundRequestSchema,
  resolveRefundSchema,
  createRefundRequestHandler,
  listMyRefundRequestsHandler,
  listSellerRefundRequestsHandler,
  resolveRefundRequestHandler,
  getRefundEligibilityHandler,
  sellerRefundDecisionSchema,
  sellerDecideRefundHandler,
  listAllRefundRequestsHandler,
  listPaidRefundsHandler,
  refundConfigSchema,
  getRefundConfigHandler,
  updateRefundConfigHandler,
} from "../controllers/refund.controller.js";

import {
  listSellerPackagesHandler,
  listCustomerPackagesHandler,
  purchasePackageSchema,
  purchaseSellerPackageHandler,
  purchaseCustomerPackageHandler,
  getMySellerSubscriptionHandler,
  getMyCustomerSubscriptionHandler,
  listMySellerPackagePaymentsHandler,
  listMyCustomerPackagePaymentsHandler,
  sellerPackageSchema,
  customerPackageSchema,
  listAllSellerPackagesHandler,
  createSellerPackageHandler,
  updateSellerPackageHandler,
  deleteSellerPackageHandler,
  listAllCustomerPackagesHandler,
  createCustomerPackageHandler,
  updateCustomerPackageHandler,
  deleteCustomerPackageHandler,
  listSellerPackagePaymentsHandler,
  listCustomerPackagePaymentsHandler,
  approvePackagePaymentSchema,
  approveSellerPackagePaymentHandler,
  approveCustomerPackagePaymentHandler,
  enforceSellerProductLimitsHandler,
} from "../controllers/package.controller.js";

import {
  posSaleSchema,
  createPosSaleHandler,
  searchPosProductsHandler,
  posReceiptHandler,
} from "../controllers/pos.controller.js";

export const addonRouter = Router();

// --- Classified products (customer-to-customer listings) ---
addonRouter.get("/classifieds", asyncHandler(listClassifiedsHandler));
addonRouter.post("/classifieds", authenticate, validateBody(classifiedSchema), asyncHandler(createClassifiedHandler));
addonRouter.get("/classifieds/mine", authenticate, asyncHandler(listMyClassifiedsHandler));
// Before /:id, so "slug" is not captured as an id.
addonRouter.get("/classifieds/slug/:slug", asyncHandler(getClassifiedBySlugHandler));
addonRouter.patch("/classifieds/:id", authenticate, validateBody(classifiedSchema.partial()), asyncHandler(updateClassifiedHandler));
addonRouter.delete("/classifieds/:id", authenticate, asyncHandler(deleteClassifiedHandler));
addonRouter.post(
  "/classifieds/:id/moderate",
  authenticate,
  requirePermission("catalog.moderate"),
  validateBody(moderateClassifiedSchema),
  asyncHandler(moderateClassifiedHandler),
);

// --- Affiliate program (affiliate-facing) ---
addonRouter.get("/affiliate/config", asyncHandler(getAffiliateConfigHandler));
addonRouter.post("/affiliate/join", authenticate, asyncHandler(joinAffiliateHandler));
addonRouter.get("/affiliate/me", authenticate, asyncHandler(getMyAffiliateHandler));
addonRouter.get("/affiliate/earnings", authenticate, asyncHandler(listMyAffiliateEarningsHandler));
addonRouter.get("/affiliate/referrals", authenticate, asyncHandler(listMyReferralsHandler));
addonRouter.get("/affiliate/withdrawals", authenticate, asyncHandler(listMyAffiliateWithdrawalsHandler));
addonRouter.post(
  "/affiliate/withdrawals",
  authenticate,
  validateBody(affiliateWithdrawSchema),
  asyncHandler(createAffiliateWithdrawHandler),
);
addonRouter.get("/affiliate/payment-settings", authenticate, asyncHandler(getAffiliatePaymentSettingsHandler));
addonRouter.put(
  "/affiliate/payment-settings",
  authenticate,
  validateBody(affiliatePaymentSettingsSchema),
  asyncHandler(updateAffiliatePaymentSettingsHandler),
);

// --- Affiliate program (admin) ---
addonRouter.put(
  "/admin/affiliate/config",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(affiliateConfigSchema),
  asyncHandler(updateAffiliateConfigHandler),
);
addonRouter.get("/admin/affiliate/users", authenticate, requirePermission("addons.manage"), asyncHandler(listAffiliateUsersHandler));
addonRouter.get("/admin/affiliate/users/:id", authenticate, requirePermission("addons.manage"), asyncHandler(getAffiliateUserHandler));
addonRouter.patch(
  "/admin/affiliate/users/:id",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(moderateAffiliateSchema),
  asyncHandler(moderateAffiliateUserHandler),
);
addonRouter.get(
  "/admin/affiliate/withdrawals",
  authenticate,
  requirePermission("addons.manage"),
  asyncHandler(listAffiliateWithdrawalsHandler),
);
addonRouter.post(
  "/admin/affiliate/withdrawals/:id/resolve",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(resolveAffiliateWithdrawSchema),
  asyncHandler(resolveAffiliateWithdrawHandler),
);
addonRouter.get("/admin/affiliate/payments", authenticate, requirePermission("addons.manage"), asyncHandler(listAffiliatePaymentsHandler));
// Direct payout, separate from resolving a withdrawal request.
addonRouter.post(
  "/admin/affiliate/users/:id/pay",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(payAffiliateSchema),
  asyncHandler(payAffiliateHandler),
);
addonRouter.get("/admin/affiliate/referrals", authenticate, requirePermission("addons.manage"), asyncHandler(listReferredUsersHandler));

// --- Club points (member-facing) ---
addonRouter.get("/club-points/me", authenticate, asyncHandler(getMyClubPointsHandler));
addonRouter.get("/club-points/history", authenticate, asyncHandler(listMyClubPointHistoryHandler));
addonRouter.post(
  "/club-points/convert",
  authenticate,
  validateBody(convertClubPointsSchema),
  asyncHandler(convertClubPointsHandler),
);

// --- Club points (admin) ---
addonRouter.get("/admin/club-points/config", authenticate, requirePermission("addons.manage"), asyncHandler(getClubPointConfigHandler));
addonRouter.put(
  "/admin/club-points/config",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(clubPointConfigSchema),
  asyncHandler(updateClubPointConfigHandler),
);
addonRouter.get("/admin/club-points/products", authenticate, requirePermission("addons.manage"), asyncHandler(listProductClubPointsHandler));
addonRouter.patch(
  "/admin/club-points/products/:id",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(setProductClubPointsSchema),
  asyncHandler(setProductClubPointsHandler),
);
addonRouter.post(
  "/admin/club-points/products/bulk",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(setAllProductClubPointsSchema),
  asyncHandler(setAllProductClubPointsHandler),
);
addonRouter.get("/admin/club-points/users", authenticate, requirePermission("addons.manage"), asyncHandler(listClubPointUsersHandler));
addonRouter.get(
  "/admin/club-points/users/:id",
  authenticate,
  requirePermission("addons.manage"),
  asyncHandler(getUserClubPointDetailHandler),
);

// --- Refund requests ---
addonRouter.post("/refunds", authenticate, validateBody(refundRequestSchema), asyncHandler(createRefundRequestHandler));
addonRouter.get("/refunds/mine", authenticate, asyncHandler(listMyRefundRequestsHandler));
addonRouter.get("/refunds/eligibility/:orderId", authenticate, asyncHandler(getRefundEligibilityHandler));
addonRouter.get("/refunds/seller", authenticate, requireRole("seller"), asyncHandler(listSellerRefundRequestsHandler));
addonRouter.post(
  "/refunds/:id/seller-decision",
  authenticate,
  requireRole("seller"),
  validateBody(sellerRefundDecisionSchema),
  asyncHandler(sellerDecideRefundHandler),
);
addonRouter.post(
  "/refunds/:id/resolve",
  authenticate,
  requirePermission("orders.manage"),
  validateBody(resolveRefundSchema),
  asyncHandler(resolveRefundRequestHandler),
);
addonRouter.get("/admin/refunds", authenticate, requirePermission("refunds.manage"), asyncHandler(listAllRefundRequestsHandler));
addonRouter.get("/admin/refunds/paid", authenticate, requirePermission("refunds.manage"), asyncHandler(listPaidRefundsHandler));
addonRouter.get("/admin/refunds/config", authenticate, requirePermission("addons.manage"), asyncHandler(getRefundConfigHandler));
addonRouter.put(
  "/admin/refunds/config",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(refundConfigSchema),
  asyncHandler(updateRefundConfigHandler),
);

// --- Seller subscription / customer packages ---
addonRouter.get("/packages/seller", asyncHandler(listSellerPackagesHandler));
addonRouter.get("/packages/customer", asyncHandler(listCustomerPackagesHandler));
addonRouter.get("/packages/seller/mine", authenticate, requireRole("seller"), asyncHandler(getMySellerSubscriptionHandler));
addonRouter.get("/packages/customer/mine", authenticate, asyncHandler(getMyCustomerSubscriptionHandler));
addonRouter.get("/packages/seller/payments", authenticate, requireRole("seller"), asyncHandler(listMySellerPackagePaymentsHandler));
addonRouter.get("/packages/customer/payments", authenticate, asyncHandler(listMyCustomerPackagePaymentsHandler));
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

// --- Packages (admin) ---
addonRouter.get("/admin/packages/seller", authenticate, requirePermission("addons.manage"), asyncHandler(listAllSellerPackagesHandler));
addonRouter.post(
  "/admin/packages/seller",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(sellerPackageSchema),
  asyncHandler(createSellerPackageHandler),
);
addonRouter.patch(
  "/admin/packages/seller/:id",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(sellerPackageSchema.partial()),
  asyncHandler(updateSellerPackageHandler),
);
addonRouter.delete("/admin/packages/seller/:id", authenticate, requirePermission("addons.manage"), asyncHandler(deleteSellerPackageHandler));

addonRouter.get("/admin/packages/customer", authenticate, requirePermission("addons.manage"), asyncHandler(listAllCustomerPackagesHandler));
addonRouter.post(
  "/admin/packages/customer",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(customerPackageSchema),
  asyncHandler(createCustomerPackageHandler),
);
addonRouter.patch(
  "/admin/packages/customer/:id",
  authenticate,
  requirePermission("addons.manage"),
  validateBody(customerPackageSchema.partial()),
  asyncHandler(updateCustomerPackageHandler),
);
addonRouter.delete(
  "/admin/packages/customer/:id",
  authenticate,
  requirePermission("addons.manage"),
  asyncHandler(deleteCustomerPackageHandler),
);

addonRouter.get(
  "/admin/packages/seller/payments",
  authenticate,
  requirePermission("payments.manage"),
  asyncHandler(listSellerPackagePaymentsHandler),
);
addonRouter.post(
  "/admin/packages/seller/payments/:id/approve",
  authenticate,
  requirePermission("payments.manage"),
  validateBody(approvePackagePaymentSchema),
  asyncHandler(approveSellerPackagePaymentHandler),
);
addonRouter.get(
  "/admin/packages/customer/payments",
  authenticate,
  requirePermission("payments.manage"),
  asyncHandler(listCustomerPackagePaymentsHandler),
);
addonRouter.post(
  "/admin/packages/customer/payments/:id/approve",
  authenticate,
  requirePermission("payments.manage"),
  validateBody(approvePackagePaymentSchema),
  asyncHandler(approveCustomerPackagePaymentHandler),
);
addonRouter.post(
  "/admin/packages/enforce-limits",
  authenticate,
  requirePermission("addons.manage"),
  asyncHandler(enforceSellerProductLimitsHandler),
);

// --- POS (seller point-of-sale) ---
// --- Point of sale ---
// Admin and staff operate the admin till (any seller's stock); a seller operates
// their own. The controller decides scope from the role, so one route serves both.
const posOperator = [authenticate, requireRole("seller", "admin", "staff")] as const;

addonRouter.get("/pos/products", ...posOperator, asyncHandler(searchPosProductsHandler));
addonRouter.post("/pos/sales", ...posOperator, validateBody(posSaleSchema), asyncHandler(createPosSaleHandler));
addonRouter.get("/pos/sales/:id/receipt", ...posOperator, asyncHandler(posReceiptHandler));
