import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  categorySchema,
  brandSchema,
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listBrandsHandler,
  createBrandHandler,
} from "../controllers/category.controller.js";
import {
  productSchema,
  searchProductsHandler,
  getProductsByIdsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  cloneProductHandler,
  listSellerProductsHandler,
  bulkImportProductsHandler,
  listPendingProductsHandler,
  moderateProductHandler,
  approveProductSchema,
} from "../controllers/product.controller.js";

export const catalogRouter = Router();

// Public reads
catalogRouter.get("/categories", asyncHandler(listCategoriesHandler));
catalogRouter.get("/brands", asyncHandler(listBrandsHandler));
catalogRouter.get("/products", asyncHandler(searchProductsHandler));
catalogRouter.get("/products/by-ids", asyncHandler(getProductsByIdsHandler));
catalogRouter.get("/products/:slug", asyncHandler(getProductHandler));

// Admin/staff taxonomy management
catalogRouter.post(
  "/categories",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(categorySchema),
  asyncHandler(createCategoryHandler),
);
catalogRouter.patch(
  "/categories/:id",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(categorySchema.partial()),
  asyncHandler(updateCategoryHandler),
);
catalogRouter.delete(
  "/categories/:id",
  authenticate,
  requirePermission("catalog.manage"),
  asyncHandler(deleteCategoryHandler),
);
catalogRouter.post(
  "/brands",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(brandSchema),
  asyncHandler(createBrandHandler),
);

// Seller product management (ownership enforced inside the controllers via sellerId scoping)
catalogRouter.get("/seller/products", authenticate, requireRole("seller"), asyncHandler(listSellerProductsHandler));
catalogRouter.post(
  "/seller/products",
  authenticate,
  requireRole("seller"),
  validateBody(productSchema),
  asyncHandler(createProductHandler),
);
catalogRouter.patch(
  "/seller/products/:id",
  authenticate,
  requireRole("seller"),
  validateBody(productSchema.partial()),
  asyncHandler(updateProductHandler),
);
catalogRouter.delete("/seller/products/:id", authenticate, requireRole("seller"), asyncHandler(deleteProductHandler));
catalogRouter.post("/seller/products/:id/clone", authenticate, requireRole("seller"), asyncHandler(cloneProductHandler));
catalogRouter.post(
  "/seller/products/bulk-import",
  authenticate,
  requireRole("seller"),
  upload.single("file"),
  asyncHandler(bulkImportProductsHandler),
);

// Admin moderation queue
catalogRouter.get(
  "/admin/products/pending",
  authenticate,
  requirePermission("catalog.moderate"),
  asyncHandler(listPendingProductsHandler),
);
catalogRouter.post(
  "/admin/products/:id/moderate",
  authenticate,
  requirePermission("catalog.moderate"),
  validateBody(approveProductSchema),
  asyncHandler(moderateProductHandler),
);
