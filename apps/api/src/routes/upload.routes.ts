import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileHandler, uploadManyHandler } from "../controllers/upload.controller.js";

export const uploadRouter = Router();

// Always authenticated: an open upload endpoint is free file hosting for anyone
// who finds it.
uploadRouter.post("/", authenticate, upload.single("file"), asyncHandler(uploadFileHandler));
uploadRouter.post("/batch", authenticate, upload.array("files", 10), asyncHandler(uploadManyHandler));
