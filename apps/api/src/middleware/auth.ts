import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@ecommercemultivendor/types";
import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "./errorHandler.js";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  permissions?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Users banned since their access token was issued.
 *
 * Ban was previously only checked at login and refresh, so a token already in
 * the wild kept working for its full lifetime. Rather than a database read on
 * every request, banned ids are held here and the set is refreshed on a short
 * interval — a ban takes effect within one window instead of one token lifetime.
 */
const bannedIds = new Set<string>();
let bannedLoadedAt = 0;
const BANNED_TTL_MS = 30_000;

async function isBanned(userId: string): Promise<boolean> {
  if (Date.now() - bannedLoadedAt > BANNED_TTL_MS) {
    const { User } = await import("../models/User.js");
    const banned = await User.find({ banned: true }, { _id: 1 }).lean();
    bannedIds.clear();
    for (const user of banned) bannedIds.add(String(user._id));
    bannedLoadedAt = Date.now();
  }
  return bannedIds.has(userId);
}

/** Called when an admin bans someone, so the block is immediate. */
export function markUserBanned(userId: string) {
  bannedIds.add(userId);
}

export function markUserUnbanned(userId: string) {
  bannedIds.delete(userId);
}

// Every mutating/ownership-scoped route reads req.user.id off the verified JWT —
// never a client-supplied user_id field (the legacy app's core IDOR bug).
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  let payload;
  try {
    payload = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  isBanned(payload.sub)
    .then((banned) => {
      if (banned) return next(new ApiError(403, "This account has been suspended", "ACCOUNT_BANNED"));
      req.user = { id: payload.sub, role: payload.role, permissions: payload.permissions };
      next();
    })
    .catch(next);
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role, permissions: payload.permissions };
  } catch {
    // Ignore invalid tokens on optional routes (e.g. guest cart) instead of rejecting.
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, "Forbidden"));
    next();
  };
}

// Staff members pass this check only if explicitly granted the named permission —
// there is no blanket "staff bypasses everything" shortcut.
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (req.user.role === "admin") return next();
    if (req.user.role === "staff" && req.user.permissions?.includes(permission)) return next();
    return next(new ApiError(403, "Forbidden"));
  };
}
