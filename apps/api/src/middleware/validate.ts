import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "./errorHandler.js";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fields[issue.path.join(".") || "_"] = issue.message;
      }
      return next(new ApiError(422, "Validation failed", "VALIDATION_ERROR", fields));
    }
    req.body = result.data;
    next();
  };
}
