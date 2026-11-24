import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface DownloadTokenPayload {
  sub: string; // userId
  productId: string;
  orderId: string;
}

// Short-lived, single-purpose token (separate secret/purpose from auth tokens)
// so a download link can be safely emailed/bookmarked without granting any
// broader account access if it leaks.
export function signDownloadToken(payload: DownloadTokenPayload): string {
  return jwt.sign({ ...payload, purpose: "digital-download" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "15m", audience: "digital-download", algorithm: "HS256" });
}

export function verifyDownloadToken(token: string): DownloadTokenPayload {
  const payload = jwt.verify(token, env.EMAIL_VERIFY_SECRET, { audience: "digital-download", algorithms: ["HS256"] }) as DownloadTokenPayload & { purpose: string };
  if (payload.purpose !== "digital-download" || !payload.sub || !payload.productId || !payload.orderId) throw new Error("Invalid download token");
  return payload;
}
