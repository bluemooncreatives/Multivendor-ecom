import { Router } from "express";
import { authenticate, optionalAuthenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSslcommerzSessionHandler, createInstamojoRequestHandler, createPaystackTransactionHandler, createVoguePaySessionHandler, createPayhereSessionHandler, createNgeniusOrderHandler, sslcommerzSuccessHandler, sslcommerzFailOrCancelHandler, sslcommerzIpnHandler, instamojoRedirectHandler, paystackCallbackHandler, voguePayNotifyHandler, payhereNotifyHandler, confirmNgeniusHandler, confirmNgeniusSchema, listGatewayConfigsHandler, upsertGatewayConfigHandler, gatewayConfigSchema, } from "../controllers/extragateway.controller.js";
export const extraGatewayRouter = Router();
// Session/order creation — called by the checkout UI once an order exists.
extraGatewayRouter.post("/sslcommerz/:orderId/session", optionalAuthenticate, asyncHandler(createSslcommerzSessionHandler));
extraGatewayRouter.post("/instamojo/:orderId/session", optionalAuthenticate, asyncHandler(createInstamojoRequestHandler));
extraGatewayRouter.post("/paystack/:orderId/session", optionalAuthenticate, asyncHandler(createPaystackTransactionHandler));
extraGatewayRouter.post("/voguepay/:orderId/session", optionalAuthenticate, asyncHandler(createVoguePaySessionHandler));
extraGatewayRouter.post("/payhere/:orderId/session", optionalAuthenticate, asyncHandler(createPayhereSessionHandler));
extraGatewayRouter.post("/ngenius/:orderId/session", optionalAuthenticate, asyncHandler(createNgeniusOrderHandler));
extraGatewayRouter.post("/ngenius/:orderId/confirm", optionalAuthenticate, validateBody(confirmNgeniusSchema), asyncHandler(confirmNgeniusHandler));
// Gateway-initiated callbacks (public — no user session available here).
extraGatewayRouter.post("/sslcommerz/success/:orderId", asyncHandler(sslcommerzSuccessHandler));
extraGatewayRouter.post("/sslcommerz/fail/:orderId", asyncHandler(sslcommerzFailOrCancelHandler));
extraGatewayRouter.post("/sslcommerz/cancel/:orderId", asyncHandler(sslcommerzFailOrCancelHandler));
extraGatewayRouter.post("/sslcommerz/ipn/:orderId", asyncHandler(sslcommerzIpnHandler));
extraGatewayRouter.get("/instamojo/redirect/:orderId", asyncHandler(instamojoRedirectHandler));
extraGatewayRouter.get("/paystack/callback/:orderId", asyncHandler(paystackCallbackHandler));
extraGatewayRouter.post("/voguepay/notify/:orderId", asyncHandler(voguePayNotifyHandler));
extraGatewayRouter.post("/payhere/notify/:orderId", asyncHandler(payhereNotifyHandler));
// Admin credential management
extraGatewayRouter.get("/admin/gateways", authenticate, requirePermission("payments.manage"), asyncHandler(listGatewayConfigsHandler));
extraGatewayRouter.put("/admin/gateways/:code", authenticate, requirePermission("payments.manage"), validateBody(gatewayConfigSchema), asyncHandler(upsertGatewayConfigHandler));
//# sourceMappingURL=extragateway.routes.js.map