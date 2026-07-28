import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listActivePickupPointsHandler, listAdminPickupPointsHandler, createPickupPointHandler, updatePickupPointHandler, deletePickupPointHandler, pickupPointSchema, } from "../controllers/pickuppoint.controller.js";
export const pickupPointRouter = Router();
pickupPointRouter.get("/", asyncHandler(listActivePickupPointsHandler));
pickupPointRouter.get("/admin", authenticate, requirePermission("settings.manage"), asyncHandler(listAdminPickupPointsHandler));
pickupPointRouter.post("/admin", authenticate, requirePermission("settings.manage"), validateBody(pickupPointSchema), asyncHandler(createPickupPointHandler));
pickupPointRouter.patch("/admin/:id", authenticate, requirePermission("settings.manage"), validateBody(pickupPointSchema.partial()), asyncHandler(updatePickupPointHandler));
pickupPointRouter.delete("/admin/:id", authenticate, requirePermission("settings.manage"), asyncHandler(deletePickupPointHandler));
//# sourceMappingURL=pickuppoint.routes.js.map