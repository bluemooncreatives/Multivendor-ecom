import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPageBySlugHandler,
  listPagesHandler,
  createPageHandler,
  updatePageHandler,
  deletePageHandler,
  getPolicyHandler,
  upsertPolicyHandler,
  listLinksHandler,
  createLinkHandler,
  updateLinkHandler,
  deleteLinkHandler,
  pageSchema,
  upsertPolicySchema,
  linkSchema,
} from "../controllers/cms.controller.js";

export const cmsRouter = Router();

// Pages
cmsRouter.get("/pages/:slug", asyncHandler(getPageBySlugHandler));
cmsRouter.get("/admin/pages", authenticate, requirePermission("settings.manage"), asyncHandler(listPagesHandler));
cmsRouter.post("/admin/pages", authenticate, requirePermission("settings.manage"), validateBody(pageSchema), asyncHandler(createPageHandler));
cmsRouter.patch(
  "/admin/pages/:id",
  authenticate,
  requirePermission("settings.manage"),
  validateBody(pageSchema.partial()),
  asyncHandler(updatePageHandler),
);
cmsRouter.delete("/admin/pages/:id", authenticate, requirePermission("settings.manage"), asyncHandler(deletePageHandler));

// Policies
cmsRouter.get("/policies/:type", asyncHandler(getPolicyHandler));
cmsRouter.put(
  "/admin/policies/:type",
  authenticate,
  requirePermission("settings.manage"),
  validateBody(upsertPolicySchema),
  asyncHandler(upsertPolicyHandler),
);

// Links
cmsRouter.get("/links", asyncHandler(listLinksHandler));
cmsRouter.post("/admin/links", authenticate, requirePermission("settings.manage"), validateBody(linkSchema), asyncHandler(createLinkHandler));
cmsRouter.patch(
  "/admin/links/:id",
  authenticate,
  requirePermission("settings.manage"),
  validateBody(linkSchema.partial()),
  asyncHandler(updateLinkHandler),
);
cmsRouter.delete("/admin/links/:id", authenticate, requirePermission("settings.manage"), asyncHandler(deleteLinkHandler));
