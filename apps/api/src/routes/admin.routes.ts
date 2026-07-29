import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  dashboardSummaryHandler,
  listUsersHandler,
  banUserHandler,
  banUserSchema,
  assignStaffPermissionsHandler,
  assignStaffPermissionsSchema,
  listRolesHandler,
  createRoleHandler,
  roleSchema,
  verifySellerHandler,
  verifySellerSchema,
  listWithdrawRequestsHandler,
  resolveWithdrawRequestHandler,
  resolveWithdrawSchema,
  listAllOrdersHandler,
  getGeneralSettingsHandler,
  updateGeneralSettingsHandler,
  getSeoSettingsHandler,
  updateSeoSettingsHandler,
  getBusinessSettingsHandler,
  updateBusinessSettingsHandler,
  listAddonsHandler,
  toggleAddonHandler,
  toggleAddonSchema,
  impersonateUserHandler,
} from "../controllers/admin.controller.js";
import {
  getSettingsGroupHandler,
  updateSettingsGroupHandler,
  listAllVerificationFieldsHandler,
  createVerificationFieldHandler,
  updateVerificationFieldHandler,
  deleteVerificationFieldHandler,
  verificationFieldSchema,
  verificationFieldPatchSchema,
} from "../controllers/settings.controller.js";
import {
  listAdminRechargeRequestsHandler,
  resolveRechargeRequestHandler,
  resolveRechargeRequestSchema,
} from "../controllers/wallet.controller.js";
import {
  listAdminTicketsHandler,
  replyTicketHandler,
  replyTicketSchema,
  getTicketHandler,
  updateTicketHandler,
  updateTicketSchema,
  bulkImportCustomersHandler,
} from "../controllers/customer.controller.js";
import {
  listSellersHandler,
  getSellerDetailHandler,
  getSellerPaymentHistoryHandler,
  payToSellerHandler,
  payoutSchema,
  listAllPayoutsHandler,
  listPendingShopVerificationsHandler,
} from "../controllers/sellermanage.controller.js";
import {
  updateRoleHandler,
  deleteRoleHandler,
  listPermissionsHandler,
  listStaffHandler,
  createStaffHandler,
  createStaffSchema,
  updateStaffHandler,
  updateStaffSchema,
  deleteStaffHandler,
} from "../controllers/staff.controller.js";
import {
  updateOrderStatusHandler,
  updateOrderStatusSchema,
  updateOrderPaymentStatusHandler,
  updatePaymentStatusSchema,
  cancelOrderAsAdminHandler,
  listOrdersByPickupPointHandler,
} from "../controllers/adminorder.controller.js";
import {
  getOtpSettingsHandler,
  updateOtpSettingsHandler,
  otpSettingsSchema,
  updateOtpCredentialsHandler,
  otpCredentialsSchema,
  sendBulkSmsHandler,
  sendSmsSchema,
  listSmsLogsHandler,
} from "../controllers/sms.controller.js";
import { searchReportHandler } from "../controllers/search.controller.js";
import { upload } from "../middleware/upload.js";

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get("/dashboard", requirePermission("dashboard.view"), asyncHandler(dashboardSummaryHandler));

adminRouter.get("/users", requirePermission("users.manage"), asyncHandler(listUsersHandler));
adminRouter.patch("/users/:id/ban", requirePermission("users.manage"), validateBody(banUserSchema), asyncHandler(banUserHandler));
adminRouter.patch(
  "/users/:id/permissions",
  requirePermission("staff.manage"),
  validateBody(assignStaffPermissionsSchema),
  asyncHandler(assignStaffPermissionsHandler),
);

adminRouter.post("/users/:id/impersonate", requireRole("admin"), asyncHandler(impersonateUserHandler));

adminRouter.post(
  "/users/import",
  requirePermission("users.manage"),
  upload.single("file"),
  asyncHandler(bulkImportCustomersHandler),
);

// --- Roles, permissions & staff ---
adminRouter.get("/roles", requirePermission("staff.manage"), asyncHandler(listRolesHandler));
adminRouter.post("/roles", requirePermission("staff.manage"), validateBody(roleSchema), asyncHandler(createRoleHandler));
adminRouter.patch("/roles/:id", requirePermission("staff.manage"), validateBody(roleSchema.partial()), asyncHandler(updateRoleHandler));
adminRouter.delete("/roles/:id", requirePermission("staff.manage"), asyncHandler(deleteRoleHandler));
adminRouter.get("/permissions", requirePermission("staff.manage"), asyncHandler(listPermissionsHandler));

adminRouter.get("/staff", requirePermission("staff.manage"), asyncHandler(listStaffHandler));
adminRouter.post("/staff", requireRole("admin"), validateBody(createStaffSchema), asyncHandler(createStaffHandler));
adminRouter.patch("/staff/:id", requireRole("admin"), validateBody(updateStaffSchema), asyncHandler(updateStaffHandler));
adminRouter.delete("/staff/:id", requireRole("admin"), asyncHandler(deleteStaffHandler));

// --- Sellers ---
adminRouter.get("/sellers", requirePermission("sellers.manage"), asyncHandler(listSellersHandler));
adminRouter.get("/sellers/verifications", requirePermission("sellers.manage"), asyncHandler(listPendingShopVerificationsHandler));
adminRouter.get("/sellers/payouts", requirePermission("payments.manage"), asyncHandler(listAllPayoutsHandler));
adminRouter.get("/sellers/:id", requirePermission("sellers.manage"), asyncHandler(getSellerDetailHandler));
adminRouter.get("/sellers/:id/payments", requirePermission("payments.manage"), asyncHandler(getSellerPaymentHistoryHandler));
adminRouter.post(
  "/sellers/:id/payouts",
  requirePermission("payments.manage"),
  validateBody(payoutSchema),
  asyncHandler(payToSellerHandler),
);
adminRouter.patch(
  "/sellers/:id/verify",
  requirePermission("sellers.manage"),
  validateBody(verifySellerSchema),
  asyncHandler(verifySellerHandler),
);

adminRouter.get("/withdrawals", requirePermission("payments.manage"), asyncHandler(listWithdrawRequestsHandler));
adminRouter.patch(
  "/withdrawals/:id",
  requirePermission("payments.manage"),
  validateBody(resolveWithdrawSchema),
  asyncHandler(resolveWithdrawRequestHandler),
);

// --- Orders ---
adminRouter.get("/orders", requirePermission("orders.manage"), asyncHandler(listAllOrdersHandler));
adminRouter.get("/orders/by-pickup-point", requirePermission("pickuppoints.manage"), asyncHandler(listOrdersByPickupPointHandler));
adminRouter.patch(
  "/orders/:id/status",
  requirePermission("orders.manage"),
  validateBody(updateOrderStatusSchema),
  asyncHandler(updateOrderStatusHandler),
);
adminRouter.patch(
  "/orders/:id/payment-status",
  requirePermission("orders.manage"),
  validateBody(updatePaymentStatusSchema),
  asyncHandler(updateOrderPaymentStatusHandler),
);
adminRouter.post("/orders/:id/cancel", requirePermission("orders.manage"), asyncHandler(cancelOrderAsAdminHandler));

// --- Support tickets ---
adminRouter.get("/tickets", requirePermission("tickets.manage"), asyncHandler(listAdminTicketsHandler));
adminRouter.get("/tickets/:id", requirePermission("tickets.manage"), asyncHandler(getTicketHandler));
adminRouter.patch(
  "/tickets/:id",
  requirePermission("tickets.manage"),
  validateBody(updateTicketSchema),
  asyncHandler(updateTicketHandler),
);
adminRouter.post(
  "/tickets/:id/reply",
  requirePermission("tickets.manage"),
  validateBody(replyTicketSchema),
  asyncHandler(replyTicketHandler),
);

adminRouter.get("/wallet-recharges", requirePermission("payments.manage"), asyncHandler(listAdminRechargeRequestsHandler));
adminRouter.patch(
  "/wallet-recharges/:id",
  requirePermission("payments.manage"),
  validateBody(resolveRechargeRequestSchema),
  asyncHandler(resolveRechargeRequestHandler),
);

adminRouter.get("/settings/general", requirePermission("settings.manage"), asyncHandler(getGeneralSettingsHandler));
adminRouter.put("/settings/general", requirePermission("settings.manage"), asyncHandler(updateGeneralSettingsHandler));
adminRouter.get("/settings/seo", requirePermission("seo.manage"), asyncHandler(getSeoSettingsHandler));
adminRouter.put("/settings/seo", requirePermission("seo.manage"), asyncHandler(updateSeoSettingsHandler));
adminRouter.get("/settings/business", requirePermission("settings.manage"), asyncHandler(getBusinessSettingsHandler));
adminRouter.put("/settings/business", requirePermission("settings.manage"), asyncHandler(updateBusinessSettingsHandler));

// Credential-bearing groups (smtp / storage / socialLogin / recaptcha). Secrets
// are returned as {configured, hint} only and are never sent to the browser.
adminRouter.get("/settings/groups/:group", requirePermission("settings.manage"), asyncHandler(getSettingsGroupHandler));
adminRouter.put("/settings/groups/:group", requirePermission("settings.manage"), asyncHandler(updateSettingsGroupHandler));

// Seller verification form builder
adminRouter.get(
  "/settings/verification-fields",
  requirePermission("settings.manage"),
  asyncHandler(listAllVerificationFieldsHandler),
);
adminRouter.post(
  "/settings/verification-fields",
  requirePermission("settings.manage"),
  validateBody(verificationFieldSchema),
  asyncHandler(createVerificationFieldHandler),
);
adminRouter.patch(
  "/settings/verification-fields/:id",
  requirePermission("settings.manage"),
  validateBody(verificationFieldPatchSchema),
  asyncHandler(updateVerificationFieldHandler),
);
adminRouter.delete(
  "/settings/verification-fields/:id",
  requirePermission("settings.manage"),
  asyncHandler(deleteVerificationFieldHandler),
);

// --- SMS / OTP configuration ---
adminRouter.get("/settings/otp", requirePermission("settings.manage"), asyncHandler(getOtpSettingsHandler));
adminRouter.put(
  "/settings/otp",
  requirePermission("settings.manage"),
  validateBody(otpSettingsSchema),
  asyncHandler(updateOtpSettingsHandler),
);
adminRouter.put(
  "/settings/otp/credentials",
  requireRole("admin"),
  validateBody(otpCredentialsSchema),
  asyncHandler(updateOtpCredentialsHandler),
);
adminRouter.post("/sms/send", requirePermission("settings.manage"), validateBody(sendSmsSchema), asyncHandler(sendBulkSmsHandler));
adminRouter.get("/sms/logs", requirePermission("settings.manage"), asyncHandler(listSmsLogsHandler));

adminRouter.get("/reports/searches", requirePermission("reports.view"), asyncHandler(searchReportHandler));

adminRouter.get("/addons", requirePermission("settings.manage"), asyncHandler(listAddonsHandler));
adminRouter.patch(
  "/addons/:key",
  requirePermission("settings.manage"),
  validateBody(toggleAddonSchema),
  asyncHandler(toggleAddonHandler),
);
