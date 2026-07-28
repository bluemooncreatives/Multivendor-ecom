import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response) => Promise<unknown>;

// Express 4 does not catch rejected promises from async route handlers on its own;
// this forwards any thrown/rejected error to the centralized error middleware.
export function asyncHandler(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}
