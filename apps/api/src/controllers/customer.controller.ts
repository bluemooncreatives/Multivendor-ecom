import type { Request, Response } from "express";
import { z } from "zod";
import { Address } from "../models/Address.js";
import { Wishlist } from "../models/Address.js";
import { Ticket } from "../models/Support.js";
import { User } from "../models/User.js";
import { importCustomersCsv } from "../services/customerimport.service.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { ApiError } from "../middleware/errorHandler.js";

// --- Profile ---------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.union([z.literal(""), z.string().regex(/^\+[1-9]\d{7,14}$/, "Use an international phone number beginning with +")]).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(404, "User not found");
  if (req.body.phone !== undefined && req.body.phone !== (user.phone ?? "")) {
    if (req.body.phone && await User.exists({ phone: req.body.phone, phoneVerifiedAt: { $type: "date" }, _id: { $ne: user._id } })) throw new ApiError(409, "This phone number is already registered");
    if (!req.body.phone) {
      if (!user.email || !user.emailVerifiedAt) throw new ApiError(409, "Add a verified email address before removing your phone number");
      user.phone = undefined; user.phoneVerifiedAt = null; user.pendingPhone = undefined;
    } else { user.pendingPhone = req.body.phone; }
  } else if (req.body.phone !== undefined) {
    user.pendingPhone = undefined;
  }
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.avatarUrl !== undefined) user.avatarUrl = req.body.avatarUrl;
  await user.save();
  res.json(user);
}

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export async function changePasswordHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw new ApiError(404, "User not found");

  const valid = await comparePassword(req.body.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await hashPassword(req.body.newPassword);
  await user.save();
  res.status(204).send();
}

// --- Addresses ---------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().default("Home"),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export async function listAddressesHandler(req: Request, res: Response) {
  res.json({ items: await Address.find({ userId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 }) });
}

export async function createAddressHandler(req: Request, res: Response) {
  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
  }
  const address = await Address.create({ ...req.body, userId: req.user!.id });
  res.status(201).json(address);
}

export async function updateAddressHandler(req: Request, res: Response) {
  if (!await Address.exists({ _id: req.params.id, userId: req.user!.id })) throw new ApiError(404, "Address not found");
  if (req.body.isDefault) {
    await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
  }
  const address = await Address.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, req.body, { new: true });
  if (!address) throw new ApiError(404, "Address not found");
  res.json(address);
}

export async function deleteAddressHandler(req: Request, res: Response) {
  const deleted = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!deleted) throw new ApiError(404, "Address not found");
  res.status(204).send();
}

// --- Wishlist ------------------------------------------------------------------

export async function listWishlistHandler(req: Request, res: Response) {
  const items = await Wishlist.find({ userId: req.user!.id }).populate("productId").sort({ createdAt: -1 });
  res.json({ items });
}

export const wishlistSchema = z.object({ productId: z.string() });

export async function addWishlistHandler(req: Request, res: Response) {
  const item = await Wishlist.findOneAndUpdate(
    { userId: req.user!.id, productId: req.body.productId },
    { userId: req.user!.id, productId: req.body.productId },
    { upsert: true, new: true },
  );
  res.status(201).json(item);
}

export async function removeWishlistHandler(req: Request, res: Response) {
  await Wishlist.deleteOne({ userId: req.user!.id, productId: req.params.productId });
  res.status(204).send();
}

// --- Support tickets ------------------------------------------------------------

export const createTicketSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
});

export async function createTicketHandler(req: Request, res: Response) {
  const ticket = await Ticket.create({
    userId: req.user!.id,
    subject: req.body.subject,
    replies: [{ authorId: req.user!.id, message: req.body.message }],
  });
  res.status(201).json(ticket);
}

export async function listMyTicketsHandler(req: Request, res: Response) {
  res.json({ items: await Ticket.find({ userId: req.user!.id }).sort({ updatedAt: -1 }) });
}

export async function listAdminTicketsHandler(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  res.json({
    items: await Ticket.find(status ? { status } : {})
      .populate("userId", "name email")
      .sort({ updatedAt: -1 }),
  });
}

export async function getTicketHandler(req: Request, res: Response) {
  const filter = canManageTickets(req) ? { _id: req.params.id } : { _id: req.params.id, userId: req.user!.id };
  const ticket = await Ticket.findOne(filter)
    .populate("userId", "name email")
    .populate("replies.authorId", "name role avatarUrl");
  if (!ticket) throw new ApiError(404, "Ticket not found");
  res.json(ticket);
}

export const replyTicketSchema = z.object({ message: z.string().min(1) });

export async function replyTicketHandler(req: Request, res: Response) {
  const filter = canManageTickets(req) ? { _id: req.params.id } : { _id: req.params.id, userId: req.user!.id };
  const ticket = await Ticket.findOne(filter);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (ticket.status === "closed") throw new ApiError(409, "This ticket is closed. Open a new one to continue.");

  ticket.replies.push({ authorId: req.user!.id, message: req.body.message } as never);
  ticket.status = canManageTickets(req) ? "answered" : "open";
  await ticket.save();
  res.json(ticket);
}

export const updateTicketSchema = z.object({
  status: z.enum(["open", "answered", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

// A customer may close their own ticket but cannot reopen or reprioritise it —
// triage stays with support, so nobody can jump the queue by setting "high".
export async function updateTicketHandler(req: Request, res: Response) {
  const isStaff = canManageTickets(req);
  if (!isStaff) {
    if (req.body.priority !== undefined) throw new ApiError(403, "Only support staff can set ticket priority");
    if (req.body.status !== "closed") throw new ApiError(403, "You can only close your own ticket");
  }

  const filter = isStaff ? { _id: req.params.id } : { _id: req.params.id, userId: req.user!.id };
  const ticket = await Ticket.findOneAndUpdate(filter, req.body, { new: true });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  res.json(ticket);
}

function canManageTickets(req: Request) {
  return req.user?.role === "admin" || (req.user?.role === "staff" && req.user.permissions?.includes("tickets.manage"));
}

// --- Admin: customer import ------------------------------------------------------

export async function bulkImportCustomersHandler(req: Request, res: Response) {
  if (!req.file) throw new ApiError(400, "A CSV file is required");
  const result = await importCustomersCsv(req.file.buffer);
  res.status(201).json(result);
}
