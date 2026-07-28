import { Router } from "express";
import { authenticate, optionalAuthenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createStripeIntentHandler, createRazorpayOrderHandler, createPaypalOrderHandler, capturePaypalOrderHandler, submitManualPaymentHandler, approveManualPaymentHandler, capturePaypalSchema, submitManualPaymentSchema, approveManualPaymentSchema, } from "../controllers/payment.controller.js";
export const paymentRouter = Router();
paymentRouter.post("/:orderId/stripe/intent", optionalAuthenticate, asyncHandler(createStripeIntentHandler));
paymentRouter.post("/:orderId/razorpay/order", optionalAuthenticate, asyncHandler(createRazorpayOrderHandler));
paymentRouter.post("/:orderId/paypal/order", optionalAuthenticate, asyncHandler(createPaypalOrderHandler));
paymentRouter.post("/:orderId/paypal/capture", optionalAuthenticate, validateBody(capturePaypalSchema), asyncHandler(capturePaypalOrderHandler));
paymentRouter.post("/:orderId/manual", optionalAuthenticate, validateBody(submitManualPaymentSchema), asyncHandler(submitManualPaymentHandler));
paymentRouter.post("/:orderId/manual/approve", authenticate, requirePermission("payments.manage"), validateBody(approveManualPaymentSchema), asyncHandler(approveManualPaymentHandler));
//# sourceMappingURL=payment.routes.js.map