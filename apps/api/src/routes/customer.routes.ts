import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getMyWalletHandler,
  listMyWalletHistoryHandler,
  createRechargeRequestHandler,
  listMyRechargeRequestsHandler,
  createRechargeRequestSchema,
} from "../controllers/wallet.controller.js";
import {
  addressSchema,
  listAddressesHandler,
  createAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
  listWishlistHandler,
  addWishlistHandler,
  removeWishlistHandler,
  wishlistSchema,
  createTicketSchema,
  createTicketHandler,
  listMyTicketsHandler,
  replyTicketSchema,
  replyTicketHandler,
  getTicketHandler,
  updateTicketHandler,
  updateTicketSchema,
  updateProfileSchema,
  updateProfileHandler,
  changePasswordSchema,
  changePasswordHandler,
} from "../controllers/customer.controller.js";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.get("/wallet", asyncHandler(getMyWalletHandler));
customerRouter.get("/wallet/history", asyncHandler(listMyWalletHistoryHandler));
customerRouter.post("/wallet/recharge", validateBody(createRechargeRequestSchema), asyncHandler(createRechargeRequestHandler));
customerRouter.get("/wallet/recharge", asyncHandler(listMyRechargeRequestsHandler));

customerRouter.get("/addresses", asyncHandler(listAddressesHandler));
customerRouter.post("/addresses", validateBody(addressSchema), asyncHandler(createAddressHandler));
customerRouter.patch("/addresses/:id", validateBody(addressSchema.partial()), asyncHandler(updateAddressHandler));
customerRouter.delete("/addresses/:id", asyncHandler(deleteAddressHandler));

customerRouter.get("/wishlist", asyncHandler(listWishlistHandler));
customerRouter.post("/wishlist", validateBody(wishlistSchema), asyncHandler(addWishlistHandler));
customerRouter.delete("/wishlist/:productId", asyncHandler(removeWishlistHandler));

customerRouter.get("/tickets", asyncHandler(listMyTicketsHandler));
customerRouter.post("/tickets", validateBody(createTicketSchema), asyncHandler(createTicketHandler));
customerRouter.get("/tickets/:id", asyncHandler(getTicketHandler));
customerRouter.patch("/tickets/:id", validateBody(updateTicketSchema), asyncHandler(updateTicketHandler));
customerRouter.post("/tickets/:id/reply", validateBody(replyTicketSchema), asyncHandler(replyTicketHandler));

customerRouter.patch("/profile", validateBody(updateProfileSchema), asyncHandler(updateProfileHandler));
customerRouter.post("/change-password", validateBody(changePasswordSchema), asyncHandler(changePasswordHandler));
