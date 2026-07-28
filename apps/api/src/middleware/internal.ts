import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "./errorHandler.js";

// Gates server-to-server-only endpoints (currently just the social-login
// bridge) behind a shared secret the browser never has access to.
export function requireInternalSecret(req: Request, _res: Response, next: NextFunction) {
  if (req.header("x-internal-secret") !== env.INTERNAL_API_SECRET) {
    return next(new ApiError(403, "Forbidden"));
  }
  next();
}
