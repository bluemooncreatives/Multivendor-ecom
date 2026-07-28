import type { Request, Response } from "express";
import { z } from "zod";
import { Address } from "../models/Address.js";
import { Wishlist } from "../models/Address.js";
import { Ticket } from "../models/Support.js";
import { User } from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { ApiError } from "../middleware/errorHandler.js";

// --- Profile ---------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.user!.id, req.body, { new: true });
  if (!user) throw new ApiError(404, "User not found");
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

export const replyTicketSchema = z.object({ message: z.string().min(1) });

export async function replyTicketHandler(req: Request, res: Response) {
  const filter = req.user!.role === "customer" ? { _id: req.params.id, userId: req.user!.id } : { _id: req.params.id };
  const ticket = await Ticket.findOne(filter);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  ticket.replies.push({ authorId: req.user!.id, message: req.body.message } as never);
  ticket.status = req.user!.role === "customer" ? "open" : "answered";
  await ticket.save();
  res.json(ticket);
}
