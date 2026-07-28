import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  stockReportHandler,
  salesReportHandler,
  sellerSalesReportHandler,
  wishlistReportHandler,
  customerGrowthReportHandler,
} from "../controllers/report.controller.js";

export const reportRouter = Router();

reportRouter.use(authenticate, requirePermission("orders.manage"));

reportRouter.get("/stock", asyncHandler(stockReportHandler));
reportRouter.get("/sales", asyncHandler(salesReportHandler));
reportRouter.get("/sellers", asyncHandler(sellerSalesReportHandler));
reportRouter.get("/wishlist", asyncHandler(wishlistReportHandler));
reportRouter.get("/customers", asyncHandler(customerGrowthReportHandler));
