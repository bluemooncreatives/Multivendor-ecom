import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  startConversationHandler,
  listMyConversationsHandler,
  getConversationHandler,
  sendMessageHandler,
  listAdminConversationsHandler,
  markConversationReadHandler,
  getUnreadCountHandler,
  deleteConversationHandler,
  startConversationSchema,
  sendMessageSchema,
} from "../controllers/conversation.controller.js";

export const conversationRouter = Router();

conversationRouter.use(authenticate);

conversationRouter.get("/", asyncHandler(listMyConversationsHandler));
conversationRouter.post("/", validateBody(startConversationSchema), asyncHandler(startConversationHandler));
conversationRouter.get("/admin", requirePermission("conversations.manage"), asyncHandler(listAdminConversationsHandler));
conversationRouter.get("/unread-count", asyncHandler(getUnreadCountHandler));
conversationRouter.get("/:id", asyncHandler(getConversationHandler));
conversationRouter.delete("/:id", asyncHandler(deleteConversationHandler));
conversationRouter.post("/:id/messages", validateBody(sendMessageSchema), asyncHandler(sendMessageHandler));
conversationRouter.post("/:id/read", asyncHandler(markConversationReadHandler));
