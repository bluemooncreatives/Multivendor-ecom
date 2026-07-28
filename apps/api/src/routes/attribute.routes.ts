import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listAttributesHandler,
  createAttributeHandler,
  updateAttributeHandler,
  deleteAttributeHandler,
  listColorsHandler,
  createColorHandler,
  deleteColorHandler,
  attributeSchema,
  colorSchema,
} from "../controllers/attribute.controller.js";

export const attributeRouter = Router();

attributeRouter.get("/attributes", asyncHandler(listAttributesHandler));
attributeRouter.post(
  "/attributes",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(attributeSchema),
  asyncHandler(createAttributeHandler),
);
attributeRouter.patch(
  "/attributes/:id",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(attributeSchema.partial()),
  asyncHandler(updateAttributeHandler),
);
attributeRouter.delete("/attributes/:id", authenticate, requirePermission("catalog.manage"), asyncHandler(deleteAttributeHandler));

attributeRouter.get("/colors", asyncHandler(listColorsHandler));
attributeRouter.post(
  "/colors",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(colorSchema),
  asyncHandler(createColorHandler),
);
attributeRouter.delete("/colors/:id", authenticate, requirePermission("catalog.manage"), asyncHandler(deleteColorHandler));
