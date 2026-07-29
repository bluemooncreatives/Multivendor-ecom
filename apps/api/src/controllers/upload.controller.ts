import type { Request, Response } from "express";
import { storeUpload, type UploadKind } from "../services/upload.service.js";
import { ApiError } from "../middleware/errorHandler.js";

const KINDS: UploadKind[] = ["image", "document", "digital"];

// One endpoint for every authenticated upload. `kind` decides the allow-list and
// size cap; it is validated against a fixed set rather than trusted as a path
// segment, so it can never widen what a caller is permitted to store.
export async function uploadFileHandler(req: Request, res: Response) {
  if (!req.file) throw new ApiError(400, "A file is required");

  const kind = String(req.query.kind ?? "image") as UploadKind;
  if (!KINDS.includes(kind)) throw new ApiError(400, `kind must be one of: ${KINDS.join(", ")}`);

  // Only sellers and staff may upload digital goods — those become paid
  // downloads, and a customer account has no reason to create one.
  if (kind === "digital" && !["seller", "admin", "staff"].includes(req.user!.role)) {
    throw new ApiError(403, "Only sellers and staff can upload digital products");
  }

  const stored = await storeUpload(req.file, kind, req.user!.id);
  res.status(201).json(stored);
}

export async function uploadManyHandler(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw new ApiError(400, "At least one file is required");
  if (files.length > 10) throw new ApiError(422, "Up to 10 files can be uploaded at once");

  const kind = String(req.query.kind ?? "image") as UploadKind;
  if (!KINDS.includes(kind)) throw new ApiError(400, `kind must be one of: ${KINDS.join(", ")}`);

  const stored = [];
  for (const file of files) {
    stored.push(await storeUpload(file, kind, req.user!.id));
  }
  res.status(201).json({ items: stored });
}
