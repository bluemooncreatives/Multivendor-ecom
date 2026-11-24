import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import mongoose from "mongoose";
import { ZodError } from "zod";

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
  if (res.headersSent) return _next(err);
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, code: err.code, fields: err.fields });
    return;
  }
  if (err instanceof ZodError || err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: "Invalid request data" });
    return;
  }
  if ((err as { code?: number } | null)?.code === 11000) {
    res.status(409).json({ message: "A record with these details already exists" });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ message: "Internal server error" });
}
