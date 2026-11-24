import type { Request, Response } from "express";
import { z } from "zod";
import { Conversation } from "../models/Support.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { BusinessSetting } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";
import { sendConversationMessageEmail } from "../services/email.service.js";
import { logger } from "../config/logger.js";

export const startConversationSchema = z.object({
  otherUserId: z.string(),
  productId: z.string().optional(),
  /** Legacy conversations carried a subject; it defaults to the product's name. */
  title: z.string().max(200).optional(),
  message: z.string().min(1),
});

/** Messaging can be switched off in Admin > Settings > Activation. */
async function assertConversationsEnabled() {
  const settings = await BusinessSetting.findOne({ key: "business" }, { activation: 1 });
  if (settings?.activation?.conversation === false) {
    throw new ApiError(403, "Messaging is turned off");
  }
}

/**
 * Who a shopper is allowed to open a thread with.
 *
 * The legacy app always derived the recipient from the product being asked about
 * (`ConversationController@store`), so a thread could only ever reach a seller or
 * the admin. This version took the recipient id straight from the request, which
 * let any account open a thread with any other account - including another
 * customer - so the rule is restored: the recipient must be the owner of the named
 * product, or a seller/admin/staff account.
 */
async function assertCanMessage(requesterId: string, otherUserId: string, productId?: string) {
  if (productId) {
    const product = await Product.findById(productId, { sellerId: 1, addedBy: 1 });
    if (!product) throw new ApiError(404, "Product not found");
    const owner = product.sellerId ? String(product.sellerId) : null;
    if (owner) {
      if (owner !== otherUserId) throw new ApiError(400, "That product belongs to a different seller");
      return;
    }
    // An in-house product has no vendor: the thread goes to staff.
  }

  const other = await User.findById(otherUserId, { role: 1, banned: 1 });
  if (!other) throw new ApiError(404, "Recipient not found");
  if (other.banned) throw new ApiError(403, "That account is not available");
  if (!["seller", "admin", "staff"].includes(other.role)) {
    throw new ApiError(403, "You can only message a seller or the store team");
  }
  if (String(other._id) === requesterId) throw new ApiError(400, "Cannot start a conversation with yourself");
}

export async function startConversationHandler(req: Request, res: Response) {
  await assertConversationsEnabled();
  const { otherUserId, productId, title, message } = req.body;
  if (otherUserId === req.user!.id) throw new ApiError(400, "Cannot start a conversation with yourself");
  await assertCanMessage(req.user!.id, otherUserId, productId);

  let conversation = await Conversation.findOne({
    participantIds: { $all: [req.user!.id, otherUserId] },
    ...(productId ? { productId } : {}),
  });

  if (!conversation) {
    const product = productId ? await Product.findById(productId, { name: 1 }) : null;
    conversation = await Conversation.create({
      participantIds: [req.user!.id, otherUserId],
      productId: productId ?? null,
      title: title ?? product?.name ?? null,
      messages: [],
    });
  }

  conversation.messages.push({ senderId: req.user!.id, body: message } as never);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  void notifyOtherParticipant(conversation, req.user!.id);
  res.status(201).json(conversation);
}

/**
 * Emails the other participant, after the response is sent and never awaited: a
 * slow or misconfigured SMTP host must not delay (or fail) sending a message.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyOtherParticipant(conversation: any, senderId: string) {
  try {
    const recipientId = conversation.participantIds.map(String).find((id: string) => id !== senderId);
    if (!recipientId) return;
    const [recipient, sender] = await Promise.all([
      User.findById(recipientId, { email: 1 }),
      User.findById(senderId, { name: 1 }),
    ]);
    if (!recipient?.email) return;
    await sendConversationMessageEmail(
      recipient.email,
      { name: sender?.name ?? "A customer" },
      { id: String(conversation._id), title: conversation.title },
    );
  } catch (err) {
    logger.error(`Failed to send conversation notification: ${String(err)}`);
  }
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

  // Opening a thread marks the other side's messages read, as the legacy
  // `show()` did with sender_viewed / receiver_viewed.
  const now = new Date();
  let changed = false;
  for (const message of conversation.messages) {
    if (String(message.senderId) !== req.user!.id && !message.readAt) {
      message.readAt = now;
      changed = true;
    }
  }
  if (changed) await conversation.save();

  res.json(conversation);
}

export const sendMessageSchema = z.object({ body: z.string().min(1) });

export async function sendMessageHandler(req: Request, res: Response) {
  await assertConversationsEnabled();
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user!.id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  conversation.messages.push({ senderId: req.user!.id, body: req.body.body } as never);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  void notifyOtherParticipant(conversation, req.user!.id);
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
