import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import type { Response } from "express";
import { getDecryptedGroup } from "./settings.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { UploadedFile, UploadKind, StoredFile } from "./upload.service.js";

async function s3Storage() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const config = await getDecryptedGroup("storage");
  const bucket = String(config.bucket || env.S3_BUCKET || env.AWS_BUCKET || "");
  const region = String(config.region || env.S3_REGION || env.AWS_REGION || "");
  const endpoint = String(config.endpoint || env.S3_ENDPOINT || "") || undefined;
  const accessKeyId = String(config.accessKeyId || env.S3_ACCESS_KEY_ID || "");
  const secretAccessKey = String(config.secretAccessKey || env.S3_SECRET_ACCESS_KEY || "");
  if (!bucket || !region) throw new ApiError(503, "Configure the S3 bucket and region before uploading");
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) throw new ApiError(503, "S3 credentials are incomplete");
  const client = new S3Client({ region, endpoint, forcePathStyle: Boolean(endpoint),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}) });
  return { bucket, client };
}

export async function storeOnS3(file: UploadedFile, key: string, kind: UploadKind): Promise<StoredFile> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { bucket, client } = await s3Storage();
  try {
    // Default S3 object privacy is retained. Public media is read through the
    // guarded API proxy; digital objects are only exposed by signed downloads.
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer,
      ContentType: file.mimetype, ContentLength: file.size, CacheControl: kind === "digital" ? "private, no-store" : "public, max-age=86400, immutable" }));
    return { key, size: file.size, url: kind === "digital"
      ? `s3-private://${bucket}/${key}`
      : `${env.API_PUBLIC_URL}/uploads/s3/${bucket}/${key}` };
  } finally { client.destroy(); }
}

export async function signS3DigitalDownload(url: URL) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const { bucket, client } = await s3Storage();
  try {
    const key = decodeURIComponent(url.pathname.slice(1));
    if (url.hostname !== bucket || !validKey(key, "digital")) throw new ApiError(404, "File not found");
    return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key,
      ResponseContentDisposition: "attachment", ResponseCacheControl: "private, no-store" }), { expiresIn: 60 });
  } finally { client.destroy(); }
}

function validKey(key: string, kind?: string) {
  const parts = key.split("/");
  return parts.length === 3 && (kind ? parts[0] === kind : ["image", "document"].includes(parts[0]!)) &&
    /^[a-f\d]{24}$/i.test(parts[1]!) && /^[a-f\d-]{36}\.[a-z0-9]+$/i.test(parts[2]!);
}

export async function sendPublicS3File(bucketName: string, key: string, res: Response) {
  if (!validKey(key)) throw new ApiError(404, "File not found");
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { bucket, client } = await s3Storage();
  try {
    if (bucketName !== bucket) throw new ApiError(404, "File not found");
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) throw new ApiError(404, "File not found");
    res.setHeader("Content-Type", result.ContentType ?? "application/octet-stream");
    if (result.ContentLength !== undefined) res.setHeader("Content-Length", result.ContentLength);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    await pipeline(result.Body as Readable, res);
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") throw new ApiError(404, "File not found");
    throw error;
  } finally { client.destroy(); }
}
