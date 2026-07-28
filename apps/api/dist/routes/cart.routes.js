import { Router } from "express";
import { optionalAuthenticate, authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCartHandler, setCartItemHandler, removeCartItemHandler, mergeCartHandler, setItemSchema, mergeSchema, } from "../controllers/cart.controller.js";
export const cartRouter = Router();
cartRouter.get("/", optionalAuthenticate, asyncHandler(getCartHandler));
cartRouter.put("/items", optionalAuthenticate, validateBody(setItemSchema), asyncHandler(setCartItemHandler));
cartRouter.delete("/items/:productId/:variantSku", optionalAuthenticate, asyncHandler(removeCartItemHandler));
cartRouter.post("/merge", authenticate, validateBody(mergeSchema), asyncHandler(mergeCartHandler));
//# sourceMappingURL=cart.routes.js.map