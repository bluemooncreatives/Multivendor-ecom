import { Router } from "express";
import { authenticate, optionalAuthenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createStripeIntentHandler,
  createStripeCheckoutHandler,
  createRazorpayOrderHandler,
  createPaypalOrderHandler,
  capturePaypalOrderHandler,
  submitManualPaymentHandler,
  approveManualPaymentHandler,
  listManualPaymentMethodsHandler,
  listAdminManualPaymentMethodsHandler,
  createManualPaymentMethodHandler,
  updateManualPaymentMethodHandler,
  capturePaypalSchema,
  submitManualPaymentSchema,
  approveManualPaymentSchema,
  manualPaymentMethodSchema,
} from "../controllers/payment.controller.js";

export const paymentRouter = Router();

paymentRouter.get("/manual-methods", asyncHandler(listManualPaymentMethodsHandler));
paymentRouter.get(
  "/admin/manual-methods",
  authenticate,
  requirePermission("payments.manage"),
  asyncHandler(listAdminManualPaymentMethodsHandler),
);
paymentRouter.post(
  "/admin/manual-methods",
  authenticate,
  requirePermission("payments.manage"),
  validateBody(manualPaymentMethodSchema),
  asyncHandler(createManualPaymentMethodHandler),
);
paymentRouter.patch(
  "/admin/manual-methods/:id",
  authenticate,
  requirePermission("payments.manage"),
  validateBody(manualPaymentMethodSchema.partial()),
  asyncHandler(updateManualPaymentMethodHandler),
);

paymentRouter.post("/:orderId/stripe/intent", optionalAuthenticate, asyncHandler(createStripeIntentHandler));
paymentRouter.post("/:orderId/stripe/checkout", optionalAuthenticate, asyncHandler(createStripeCheckoutHandler));
paymentRouter.post("/:orderId/razorpay/order", optionalAuthenticate, asyncHandler(createRazorpayOrderHandler));
paymentRouter.post("/:orderId/paypal/order", optionalAuthenticate, asyncHandler(createPaypalOrderHandler));
paymentRouter.post(
  "/:orderId/paypal/capture",
  optionalAuthenticate,
  validateBody(capturePaypalSchema),
  asyncHandler(capturePaypalOrderHandler),
);
paymentRouter.post(
  "/:orderId/manual",
  optionalAuthenticate,
  validateBody(submitManualPaymentSchema),
  asyncHandler(submitManualPaymentHandler),
);
paymentRouter.post(
  "/:orderId/manual/approve",
  authenticate,
  requirePermission("payments.manage"),
  validateBody(approveManualPaymentSchema),
  asyncHandler(approveManualPaymentHandler),
);
