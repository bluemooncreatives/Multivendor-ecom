import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Shop } from "../models/Shop.js";
import { Order } from "../models/Order.js";
import { SellerWithdrawRequest, SellerLedger } from "../models/Ledger.js";
import { Role, AdminAuditLog } from "../models/Rbac.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { GeneralSetting, SeoSetting, BusinessSetting, Addon } from "../models/Settings.js";
import { signAccessToken } from "../utils/jwt.js";
import { invalidateDemoModeCache } from "../middleware/demoMode.js";
import { invalidateMaintenanceCache } from "../middleware/maintenance.js";
import { markUserBanned, markUserUnbanned } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";

// --- Dashboard -------------------------------------------------------------

export async function dashboardSummaryHandler(_req: Request, res: Response) {
  const [orderStats] = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
      },
    },
  ]);
  const [sellerCount, customerCount, pendingWithdrawals] = await Promise.all([
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ role: "customer" }),
    SellerWithdrawRequest.countDocuments({ status: "pending" }),
  ]);

  res.json({
    totalOrders: orderStats?.totalOrders ?? 0,
    totalRevenue: orderStats?.totalRevenue ?? 0,
    sellerCount,
    customerCount,
    pendingWithdrawals,
  });
}

// --- Users / sellers / staff -------------------------------------------------

export async function listUsersHandler(req: Request, res: Response) {
  const { role } = req.query as { role?: string };
  const users = await User.find(role ? { role } : {}).sort({ createdAt: -1 }).limit(200);
  res.json({ items: users });
}

export const banUserSchema = z.object({ banned: z.boolean() });

export async function banUserHandler(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.params.id, { banned: req.body.banned }, { new: true });
  if (!user) throw new ApiError(404, "User not found");

  // Update the auth middleware's cache directly so the ban applies to the next
  // request rather than waiting for the refresh interval, and revoke the refresh
  // tokens so they cannot mint a fresh access token either.
  if (req.body.banned) {
    markUserBanned(String(user._id));
    await RefreshToken.deleteMany({ userId: user._id });
  } else {
    markUserUnbanned(String(user._id));
  }

  res.json(user);
}

// Impersonation issues a short-lived access token for the target user, scoped
// to their own role/permissions (never elevated), and always leaves an audit
// trail — this is the only way an admin can act "as" another account.
export async function impersonateUserHandler(req: Request, res: Response) {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "User not found");
  if (target.banned) throw new ApiError(403, "Cannot impersonate a banned account");

  await AdminAuditLog.create({
    adminId: req.user!.id,
    action: "impersonate",
    targetUserId: target._id,
    ip: req.ip,
  });

  const accessToken = signAccessToken({ sub: String(target._id), role: target.role, permissions: target.permissions ?? undefined });
  res.json({ accessToken, user: target });
}

export const assignStaffPermissionsSchema = z.object({ permissions: z.array(z.string()) });

export async function assignStaffPermissionsHandler(req: Request, res: Response) {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: "staff" },
    { permissions: req.body.permissions },
    { new: true },
  );
  if (!user) throw new ApiError(404, "Staff member not found");
  res.json(user);
}

export const roleSchema = z.object({ name: z.string().min(1), permissions: z.array(z.string()) });

export async function listRolesHandler(_req: Request, res: Response) {
  res.json({ items: await Role.find() });
}

export async function createRoleHandler(req: Request, res: Response) {
  const role = await Role.create(req.body);
  res.status(201).json(role);
}

// --- Seller verification -----------------------------------------------------

export const verifySellerSchema = z.object({ approve: z.boolean() });

export async function verifySellerHandler(req: Request, res: Response) {
  const shop = await Shop.findOneAndUpdate(
    { sellerId: req.params.id },
    { verified: req.body.approve, verificationStatus: req.body.approve ? "approved" : "rejected" },
    { new: true },
  );
  if (!shop) throw new ApiError(404, "Shop not found for this seller");
  res.json(shop);
}

// --- Withdrawals --------------------------------------------------------------

export async function listWithdrawRequestsHandler(_req: Request, res: Response) {
  const items = await SellerWithdrawRequest.find().sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}

export const resolveWithdrawSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().optional(),
});

export async function resolveWithdrawRequestHandler(req: Request, res: Response) {
  const request = await SellerWithdrawRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Withdraw request not found");
  if (request.status !== "pending") throw new ApiError(409, "This request has already been resolved");

  if (req.body.approve) {
    request.status = "paid";
    request.processedAt = new Date();
    request.processedBy = req.user!.id as never;
    await SellerLedger.create({
      sellerId: request.sellerId,
      type: "withdrawal",
      amount: -request.amount,
      note: "Withdrawal paid",
    });
  } else {
    request.status = "rejected";
    request.rejectionReason = req.body.rejectionReason;
  }
  await request.save();
  res.json(request);
}

// --- Orders -------------------------------------------------------------------

// The legacy admin order screen filtered by search term, date range, payment
// status and delivery status; all four are restored here, paginated rather than
// capped at a silent 200-row limit that hid older orders entirely.
export async function listAllOrdersHandler(req: Request, res: Response) {
  const { status, paymentStatus, q, from, to } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 30);

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  // Matches the order code or the buyer's phone — the two identifiers support
  // staff actually have when a customer calls about an order.
  if (q) {
    const term = q.slice(0, 80);
    filter.$or = [
      { code: { $regex: term, $options: "i" } },
      { "addressSnapshot.phone": { $regex: term, $options: "i" } },
    ];
  }

  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      // `to` is a calendar day, so extend it to the end of that day rather than
      // midnight, which would exclude everything placed on the chosen date.
      ...(to ? { $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pageSize });
}

// --- Settings -------------------------------------------------------------------

export async function getGeneralSettingsHandler(_req: Request, res: Response) {
  const settings = (await GeneralSetting.findOne({ key: "general" })) ?? (await GeneralSetting.create({}));
  res.json(settings);
}

export async function updateGeneralSettingsHandler(req: Request, res: Response) {
  const settings = await GeneralSetting.findOneAndUpdate({ key: "general" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json(settings);
}

export async function getSeoSettingsHandler(_req: Request, res: Response) {
  const settings = (await SeoSetting.findOne({ key: "seo" })) ?? (await SeoSetting.create({}));
  res.json(settings);
}

export async function updateSeoSettingsHandler(req: Request, res: Response) {
  const settings = await SeoSetting.findOneAndUpdate({ key: "seo" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  res.json(settings);
}

export async function getBusinessSettingsHandler(_req: Request, res: Response) {
  const settings = (await BusinessSetting.findOne({ key: "business" })) ?? (await BusinessSetting.create({}));
  res.json(settings);
}

export async function updateBusinessSettingsHandler(req: Request, res: Response) {
  const settings = await BusinessSetting.findOneAndUpdate({ key: "business" }, req.body, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  // Both guards cache their flag, so toggling either must take effect at once
  // rather than after the cache window expires.
  invalidateDemoModeCache();
  invalidateMaintenanceCache();
  res.json(settings);
}

export async function listAddonsHandler(_req: Request, res: Response) {
  res.json({ items: await Addon.find() });
}

export const toggleAddonSchema = z.object({ enabled: z.boolean() });

export async function toggleAddonHandler(req: Request, res: Response) {
  const addon = await Addon.findOneAndUpdate(
    { key: req.params.key },
    { enabled: req.body.enabled },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.json(addon);
}
