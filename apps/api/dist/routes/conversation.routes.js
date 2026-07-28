import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { startConversationHandler, listMyConversationsHandler, getConversationHandler, sendMessageHandler, listAdminConversationsHandler, startConversationSchema, sendMessageSchema, } from "../controllers/conversation.controller.js";
export const conversationRouter = Router();
conversationRouter.use(authenticate);
conversationRouter.get("/", asyncHandler(listMyConversationsHandler));
conversationRouter.post("/", validateBody(startConversationSchema), asyncHandler(startConversationHandler));
conversationRouter.get("/admin", requirePermission("orders.manage"), asyncHandler(listAdminConversationsHandler));
conversationRouter.get("/:id", asyncHandler(getConversationHandler));
conversationRouter.post("/:id/messages", validateBody(sendMessageSchema), asyncHandler(sendMessageHandler));
//# sourceMappingURL=conversation.routes.js.map