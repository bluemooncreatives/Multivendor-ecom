import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listMyDigitalPurchasesHandler,
  requestDownloadHandler,
  downloadHandler,
  requestDownloadSchema,
} from "../controllers/digitalproduct.controller.js";

export const digitalProductRouter = Router();

digitalProductRouter.get("/mine", authenticate, asyncHandler(listMyDigitalPurchasesHandler));
digitalProductRouter.post("/request-download", authenticate, validateBody(requestDownloadSchema), asyncHandler(requestDownloadHandler));
digitalProductRouter.get("/download/:token", asyncHandler(downloadHandler));
