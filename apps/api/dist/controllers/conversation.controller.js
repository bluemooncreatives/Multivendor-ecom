import { z } from "zod";
import { Conversation } from "../models/Support.js";
import { ApiError } from "../middleware/errorHandler.js";
export const startConversationSchema = z.object({
    otherUserId: z.string(),
    productId: z.string().optional(),
    message: z.string().min(1),
});
export async function startConversationHandler(req, res) {
    const { otherUserId, productId, message } = req.body;
    if (otherUserId === req.user.id)
        throw new ApiError(400, "Cannot start a conversation with yourself");
    let conversation = await Conversation.findOne({
        participantIds: { $all: [req.user.id, otherUserId] },
        ...(productId ? { productId } : {}),
    });
    if (!conversation) {
        conversation = await Conversation.create({
            participantIds: [req.user.id, otherUserId],
            productId: productId ?? null,
            messages: [],
        });
    }
    conversation.messages.push({ senderId: req.user.id, body: message });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    res.status(201).json(conversation);
}
export async function listMyConversationsHandler(req, res) {
    const conversations = await Conversation.find({ participantIds: req.user.id })
        .populate("participantIds", "name avatarUrl role")
        .populate("productId", "name slug images")
        .sort({ lastMessageAt: -1 });
    res.json({ items: conversations });
}
export async function getConversationHandler(req, res) {
    const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user.id })
        .populate("participantIds", "name avatarUrl role")
        .populate("productId", "name slug images");
    if (!conversation)
        throw new ApiError(404, "Conversation not found");
    res.json(conversation);
}
export const sendMessageSchema = z.object({ body: z.string().min(1) });
export async function sendMessageHandler(req, res) {
    const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user.id });
    if (!conversation)
        throw new ApiError(404, "Conversation not found");
    conversation.messages.push({ senderId: req.user.id, body: req.body.body });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    res.status(201).json(conversation);
}
export async function listAdminConversationsHandler(_req, res) {
    const conversations = await Conversation.find()
        .populate("participantIds", "name role")
        .sort({ lastMessageAt: -1 })
        .limit(200);
    res.json({ items: conversations });
}
//# sourceMappingURL=conversation.controller.js.map