import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getHomepageSectionsHandler,
  listAdminSlidersHandler,
  createSliderHandler,
  updateSliderHandler,
  deleteSliderHandler,
  listAdminBannersHandler,
  createBannerHandler,
  updateBannerHandler,
  deleteBannerHandler,
  listAdminHomeCategoriesHandler,
  createHomeCategoryHandler,
  deleteHomeCategoryHandler,
  toggleTopCategoryHandler,
  toggleTopBrandHandler,
  sliderSchema,
  bannerSchema,
  homeCategorySchema,
  toggleTopSchema,
} from "../controllers/homepage.controller.js";

export const homepageRouter = Router();

homepageRouter.get("/", asyncHandler(getHomepageSectionsHandler));

const manage = [authenticate, requirePermission("frontend.manage")] as const;

homepageRouter.get("/admin/sliders", ...manage, asyncHandler(listAdminSlidersHandler));
homepageRouter.post("/admin/sliders", ...manage, validateBody(sliderSchema), asyncHandler(createSliderHandler));
homepageRouter.patch("/admin/sliders/:id", ...manage, validateBody(sliderSchema.partial()), asyncHandler(updateSliderHandler));
homepageRouter.delete("/admin/sliders/:id", ...manage, asyncHandler(deleteSliderHandler));

homepageRouter.get("/admin/banners", ...manage, asyncHandler(listAdminBannersHandler));
homepageRouter.post("/admin/banners", ...manage, validateBody(bannerSchema), asyncHandler(createBannerHandler));
homepageRouter.patch("/admin/banners/:id", ...manage, validateBody(bannerSchema.partial()), asyncHandler(updateBannerHandler));
homepageRouter.delete("/admin/banners/:id", ...manage, asyncHandler(deleteBannerHandler));

homepageRouter.get("/admin/home-categories", ...manage, asyncHandler(listAdminHomeCategoriesHandler));
homepageRouter.post("/admin/home-categories", ...manage, validateBody(homeCategorySchema), asyncHandler(createHomeCategoryHandler));
homepageRouter.delete("/admin/home-categories/:id", ...manage, asyncHandler(deleteHomeCategoryHandler));

homepageRouter.patch(
  "/admin/top-categories/:id",
  ...manage,
  validateBody(toggleTopSchema),
  asyncHandler(toggleTopCategoryHandler),
);
homepageRouter.patch("/admin/top-brands/:id", ...manage, validateBody(toggleTopSchema), asyncHandler(toggleTopBrandHandler));
