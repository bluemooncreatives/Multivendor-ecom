import type { Request, Response } from "express";
import { z } from "zod";
import { Conversation } from "../models/Support.js";
import { ApiError } from "../middleware/errorHandler.js";

export const startConversationSchema = z.object({
  otherUserId: z.string(),
  productId: z.string().optional(),
  message: z.string().min(1),
});

export async function startConversationHandler(req: Request, res: Response) {
  const { otherUserId, productId, message } = req.body;
  if (otherUserId === req.user!.id) throw new ApiError(400, "Cannot start a conversation with yourself");

  let conversation = await Conversation.findOne({
    participantIds: { $all: [req.user!.id, otherUserId] },
    ...(productId ? { productId } : {}),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participantIds: [req.user!.id, otherUserId],
      productId: productId ?? null,
      messages: [],
    });
  }

  conversation.messages.push({ senderId: req.user!.id, body: message } as never);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  res.status(201).json(conversation);
}

export async function listMyConversationsHandler(req: Request, res: Response) {
  const conversations = await Conversation.find({ participantIds: req.user!.id })
    .populate("participantIds", "name avatarUrl role")
    .populate("productId", "name slug images")
    .sort({ lastMessageAt: -1 });
  res.json({ items: conversations });
}

export async function getConversationHandler(req: Request, res: Response) {
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user!.id })
    .populate("participantIds", "name avatarUrl role")
    .populate("productId", "name slug images");
  if (!conversation) throw new ApiError(404, "Conversation not found");
  res.json(conversation);
}

export const sendMessageSchema = z.object({ body: z.string().min(1) });

export async function sendMessageHandler(req: Request, res: Response) {
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user!.id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.messages.push({ senderId: req.user!.id, body: req.body.body } as never);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  res.status(201).json(conversation);
}

// Marks every message the *other* participant sent as read, driving the unread
// badge. Scoped to the requester's own conversations so it cannot be used to
// probe whether an arbitrary conversation id exists.
export async function markConversationReadHandler(req: Request, res: Response) {
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user!.id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const now = new Date();
  for (const message of conversation.messages) {
    if (String(message.senderId) !== req.user!.id && !message.readAt) message.readAt = now;
  }
  await conversation.save();
  res.json(conversation);
}

export async function getUnreadCountHandler(req: Request, res: Response) {
  const conversations = await Conversation.find({ participantIds: req.user!.id }).select("messages");
  const unread = conversations.reduce(
    (count, c) => count + c.messages.filter((m) => String(m.senderId) !== req.user!.id && !m.readAt).length,
    0,
  );
  res.json({ unread });
}

// A participant deleting a thread removes it for everyone, so this is restricted
// to the thread's own participants (admins use the moderation list instead).
export async function deleteConversationHandler(req: Request, res: Response) {
  const isStaff = req.user!.role === "admin" || req.user!.role === "staff";
  const filter = isStaff ? { _id: req.params.id } : { _id: req.params.id, participantIds: req.user!.id };

  const deleted = await Conversation.findOneAndDelete(filter);
  if (!deleted) throw new ApiError(404, "Conversation not found");
  res.status(204).send();
}

export async function listAdminConversationsHandler(_req: Request, res: Response) {
  const conversations = await Conversation.find()
    .populate("participantIds", "name role")
    .sort({ lastMessageAt: -1 })
    .limit(200);
  res.json({ items: conversations });
}
