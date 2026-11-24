import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@ecommercemultivendor/types";
import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "./errorHandler.js";
import { User } from "../models/User.js";

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

  // The signed token establishes identity. Current account state establishes
  // access, so a revoked grant or role change takes effect on the next request
  // on every API instance, including when the old access token has not expired.
  User.findById(payload.sub, { role: 1, permissions: 1, banned: 1 }).lean()
    .then((user) => {
      if (!user) return next(new ApiError(401, "Account no longer exists"));
      if (user.banned) return next(new ApiError(403, "This account has been suspended", "ACCOUNT_BANNED"));
      req.user = { id: payload.sub, role: user.role, permissions: user.permissions ?? undefined };
      next();
    })
    .catch(next);
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return next();
  return authenticate(req, _res, next);
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
