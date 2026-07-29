import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Role, StaffPermission } from "../models/Rbac.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { hashPassword } from "../utils/password.js";
import { ApiError } from "../middleware/errorHandler.js";

export async function updateRoleHandler(req: Request, res: Response) {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!role) throw new ApiError(404, "Role not found");
  res.json(role);
}

export async function deleteRoleHandler(req: Request, res: Response) {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, "Role not found");

  // Staff carry a copy of their permissions, so deleting a role that is still in
  // use would leave those accounts holding grants nothing manages any more.
  const inUse = await User.countDocuments({ role: "staff", permissions: { $all: role.permissions } });
  if (inUse > 0) throw new ApiError(409, `${inUse} staff member(s) still use this role`);

  await role.deleteOne();
  res.status(204).send();
}

// The catalog of permission strings the role editor offers, grouped for display.
export async function listPermissionsHandler(_req: Request, res: Response) {
  const items = await StaffPermission.find().sort({ group: 1, label: 1 });
  res.json({ items });
}

export async function listStaffHandler(_req: Request, res: Response) {
  const items = await User.find({ role: "staff" }).sort({ createdAt: -1 });
  res.json({ items });
}

export const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  permissions: z.array(z.string()).default([]),
});

export async function createStaffHandler(req: Request, res: Response) {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const staff = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await hashPassword(req.body.password),
    role: "staff",
    permissions: req.body.permissions,
    // Created by an admin out-of-band, so there is no verification email to wait on.
    emailVerifiedAt: new Date(),
  });
  res.status(201).json(staff);
}

export const updateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  password: z.string().min(8).max(72).optional(),
});

export async function updateStaffHandler(req: Request, res: Response) {
  const update: Record<string, unknown> = {};
  if (req.body.name) update.name = req.body.name;
  if (req.body.permissions) update.permissions = req.body.permissions;
  if (req.body.password) update.passwordHash = await hashPassword(req.body.password);

  const staff = await User.findOneAndUpdate({ _id: req.params.id, role: "staff" }, update, { new: true });
  if (!staff) throw new ApiError(404, "Staff member not found");

  // Permissions are embedded in the signed access token, so a revocation has to
  // invalidate outstanding sessions or the old grants stay live until they expire.
  if (req.body.permissions || req.body.password) {
    await RefreshToken.updateMany({ userId: staff._id, revokedAt: null }, { revokedAt: new Date() });
  }
  res.json(staff);
}

// Staff are deactivated rather than deleted: their AdminAuditLog entries and any
// ticket replies they authored must keep resolving to a real user.
export async function deleteStaffHandler(req: Request, res: Response) {
  if (req.params.id === req.user!.id) throw new ApiError(400, "You cannot deactivate your own account");

  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, role: "staff" },
    { banned: true, permissions: [] },
    { new: true },
  );
  if (!staff) throw new ApiError(404, "Staff member not found");
  await RefreshToken.updateMany({ userId: staff._id, revokedAt: null }, { revokedAt: new Date() });
  res.status(204).send();
}
