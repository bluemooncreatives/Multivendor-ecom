import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(status: number, message: string, code?: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, code: err.code, fields: err.fields });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ message: "Internal server error" });
}
