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
  listAdminRechargeRequestsHandler,
  resolveRechargeRequestHandler,
  resolveRechargeRequestSchema,
} from "../controllers/wallet.controller.js";
import { listAdminTicketsHandler, replyTicketHandler, replyTicketSchema } from "../controllers/customer.controller.js";

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

adminRouter.get("/roles", requirePermission("staff.manage"), asyncHandler(listRolesHandler));
adminRouter.post("/roles", requirePermission("staff.manage"), validateBody(roleSchema), asyncHandler(createRoleHandler));

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

adminRouter.get("/orders", requirePermission("orders.manage"), asyncHandler(listAllOrdersHandler));

adminRouter.get("/tickets", requirePermission("orders.manage"), asyncHandler(listAdminTicketsHandler));
adminRouter.post(
  "/tickets/:id/reply",
  requirePermission("orders.manage"),
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
adminRouter.get("/settings/seo", requirePermission("settings.manage"), asyncHandler(getSeoSettingsHandler));
adminRouter.put("/settings/seo", requirePermission("settings.manage"), asyncHandler(updateSeoSettingsHandler));
adminRouter.get("/settings/business", requirePermission("settings.manage"), asyncHandler(getBusinessSettingsHandler));
adminRouter.put("/settings/business", requirePermission("settings.manage"), asyncHandler(updateBusinessSettingsHandler));

adminRouter.get("/addons", requirePermission("settings.manage"), asyncHandler(listAddonsHandler));
adminRouter.patch(
  "/addons/:key",
  requirePermission("settings.manage"),
  validateBody(toggleAddonSchema),
  asyncHandler(toggleAddonHandler),
);
