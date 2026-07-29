import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";

export type UploadKind = "image" | "document" | "digital";

// Allow-lists keyed by what the file is *for*, not by what the client claims it
// is. The legacy app accepted any extension into the public webroot, which made
// uploading an executable script trivially easy.
const ALLOWED: Record<UploadKind, { mime: string[]; ext: string[] }> = {
  image: {
    mime: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    ext: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"],
  },
  document: {
    mime: ["application/pdf"],
    ext: [".pdf"],
  },
  // Digital goods are never served from the public tree — they go behind the
  // signed-token download route — so the type list can be broader.
  digital: {
    mime: [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/epub+zip",
      "audio/mpeg",
      "video/mp4",
      "image/jpeg",
      "image/png",
    ],
    ext: [".pdf", ".zip", ".epub", ".mp3", ".mp4", ".jpg", ".jpeg", ".png"],
  },
};

const MAX_BYTES: Record<UploadKind, number> = {
  image: 5 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  digital: 50 * 1024 * 1024,
};

// Magic-number check, so a .php renamed to .png is rejected even though both the
// extension and the client-supplied MIME type look fine.
const SIGNATURES: { ext: string[]; bytes: number[]; offset?: number }[] = [
  { ext: [".jpg", ".jpeg"], bytes: [0xff, 0xd8, 0xff] },
  { ext: [".png"], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: [".gif"], bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: [".webp"], bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { ext: [".pdf"], bytes: [0x25, 0x50, 0x44, 0x46] },
  { ext: [".zip", ".epub"], bytes: [0x50, 0x4b, 0x03, 0x04] },
];

function assertSignature(buffer: Buffer, ext: string) {
  const rule = SIGNATURES.find((s) => s.ext.includes(ext));
  if (!rule) return; // no signature on file for this type (mp3/mp4/avif) — size + allow-list only
  const offset = rule.offset ?? 0;
  const actual = buffer.subarray(offset, offset + rule.bytes.length);
  if (!rule.bytes.every((byte, i) => actual[i] === byte)) {
    throw new ApiError(422, "That file's contents do not match its extension");
  }
}

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredFile {
  url: string;
  /** Storage key, kept so the file can be deleted later without parsing the URL. */
  key: string;
  size: number;
}

const LOCAL_ROOT = path.resolve(fileURLToPath(import.meta.url), "../../../../../public/uploads");

export async function storeUpload(file: UploadedFile, kind: UploadKind, ownerId: string): Promise<StoredFile> {
  const rules = ALLOWED[kind];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.size > MAX_BYTES[kind]) {
    throw new ApiError(413, `That file is too large (max ${Math.round(MAX_BYTES[kind] / 1024 / 1024)} MB)`);
  }
  if (!rules.ext.includes(ext) || !rules.mime.includes(file.mimetype)) {
    throw new ApiError(422, `Unsupported file type for ${kind} uploads`);
  }
  assertSignature(file.buffer, ext);

  // Name is generated, never derived from originalname: a caller-controlled path
  // segment is how directory traversal and extension-smuggling get in.
  const key = `${kind}/${ownerId}/${randomUUID()}${ext}`;

  if (env.UPLOAD_DRIVER === "cloudinary") {
    return storeOnCloudinary(file, key, kind);
  }
  return storeLocally(file, key);
}

async function storeLocally(file: UploadedFile, key: string): Promise<StoredFile> {
  const destination = path.join(LOCAL_ROOT, key);

  // Defence in depth: even though `key` is generated, refuse anything that
  // resolves outside the uploads root.
  if (!destination.startsWith(LOCAL_ROOT + path.sep)) {
    throw new ApiError(400, "Invalid upload path");
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, file.buffer);

  return { url: `${env.API_PUBLIC_URL}/uploads/${key}`, key, size: file.size };
}

async function storeOnCloudinary(file: UploadedFile, key: string, kind: UploadKind): Promise<StoredFile> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(500, "Cloudinary is selected as the upload driver but is not configured");
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  const result = await new Promise<{ secure_url: string; public_id: string; bytes: number }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: key.replace(path.extname(key), ""),
          resource_type: kind === "image" ? "image" : "raw",
          // Digital goods must not be publicly fetchable by URL — the signed
          // download route is the only way in.
          type: kind === "digital" ? "private" : "upload",
        },
        (error, uploaded) => {
          if (error || !uploaded) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve(uploaded as never);
        },
      )
      .end(file.buffer);
  });

  return { url: result.secure_url, key: result.public_id, size: result.bytes };
}
