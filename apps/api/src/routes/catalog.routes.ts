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
  updateBrandHandler,
  deleteBrandHandler,
  listAllCategoriesHandler,
  listAllBrandsHandler,
  featureToggleSchema,
  updateCategoryFeaturedHandler,
  updateBrandFeaturedHandler,
  listChildCategoriesHandler,
  listBrandsForCategoryHandler,
  listAttributesForCategoryHandler,
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
  productFlagsSchema,
  updateProductFlagsHandler,
  listAllProductsHandler,
  adminUpdateProductHandler,
  exportProductsHandler,
  exportCategoriesHandler,
  exportSellersHandler,
  skuCombinationSchema,
  generateSkuCombinationsHandler,
  getVariantPriceHandler,
  adminCreateProductHandler,
} from "../controllers/product.controller.js";
import { suggestionsHandler, popularSearchesHandler } from "../controllers/search.controller.js";
import { optionalAuthenticate } from "../middleware/auth.js";

export const catalogRouter = Router();

// Public reads
catalogRouter.get("/categories", asyncHandler(listCategoriesHandler));
// Cascade lookups for the product form (category -> sub -> sub-sub -> brands/attributes).
catalogRouter.get("/categories/children", asyncHandler(listChildCategoriesHandler));
catalogRouter.get("/categories/brands", asyncHandler(listBrandsForCategoryHandler));
catalogRouter.get("/categories/attributes", asyncHandler(listAttributesForCategoryHandler));
catalogRouter.get("/brands", asyncHandler(listBrandsHandler));
catalogRouter.get("/search/suggestions", asyncHandler(suggestionsHandler));
catalogRouter.get("/search/popular", asyncHandler(popularSearchesHandler));
// optionalAuthenticate so a signed-in shopper's searches are attributed to them,
// while guests can still search.
catalogRouter.get("/products", optionalAuthenticate, asyncHandler(searchProductsHandler));
catalogRouter.get("/products/by-ids", asyncHandler(getProductsByIdsHandler));
catalogRouter.get("/products/:id/variant-price", asyncHandler(getVariantPriceHandler));
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
catalogRouter.get("/admin/categories", authenticate, requirePermission("catalog.manage"), asyncHandler(listAllCategoriesHandler));
catalogRouter.patch(
  "/categories/:id/featured",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(featureToggleSchema),
  asyncHandler(updateCategoryFeaturedHandler),
);
catalogRouter.post(
  "/brands",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(brandSchema),
  asyncHandler(createBrandHandler),
);
catalogRouter.get("/admin/brands", authenticate, requirePermission("catalog.manage"), asyncHandler(listAllBrandsHandler));
catalogRouter.patch(
  "/brands/:id",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(brandSchema.partial()),
  asyncHandler(updateBrandHandler),
);
catalogRouter.delete("/brands/:id", authenticate, requirePermission("catalog.manage"), asyncHandler(deleteBrandHandler));
catalogRouter.patch(
  "/brands/:id/featured",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(featureToggleSchema),
  asyncHandler(updateBrandFeaturedHandler),
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

catalogRouter.post(
  "/seller/products/sku-combinations",
  authenticate,
  requireRole("seller"),
  validateBody(skuCombinationSchema),
  asyncHandler(generateSkuCombinationsHandler),
);
catalogRouter.get("/seller/products/export", authenticate, requireRole("seller"), asyncHandler(exportProductsHandler));

// Flag toggles are shared: sellers may publish their own, staff may also feature.
catalogRouter.patch(
  "/products/:id/flags",
  authenticate,
  validateBody(productFlagsSchema),
  asyncHandler(updateProductFlagsHandler),
);

// Admin catalog & moderation queue
catalogRouter.get("/admin/products", authenticate, requirePermission("catalog.manage"), asyncHandler(listAllProductsHandler));
// Admin-owned "In House" listings, which have no seller and skip moderation.
catalogRouter.post(
  "/admin/products",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(productSchema),
  asyncHandler(adminCreateProductHandler),
);
catalogRouter.post(
  "/admin/products/sku-combinations",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(skuCombinationSchema),
  asyncHandler(generateSkuCombinationsHandler),
);
catalogRouter.patch(
  "/admin/products/:id",
  authenticate,
  requirePermission("catalog.manage"),
  validateBody(productSchema.partial()),
  asyncHandler(adminUpdateProductHandler),
);
catalogRouter.get("/admin/products/export", authenticate, requirePermission("catalog.manage"), asyncHandler(exportProductsHandler));
catalogRouter.get("/admin/categories/export", authenticate, requirePermission("catalog.manage"), asyncHandler(exportCategoriesHandler));
catalogRouter.get("/admin/sellers/export", authenticate, requirePermission("sellers.manage"), asyncHandler(exportSellersHandler));
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
