import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
// Short-lived, single-purpose token (separate secret/purpose from auth tokens)
// so a download link can be safely emailed/bookmarked without granting any
// broader account access if it leaks.
export function signDownloadToken(payload) {
    return jwt.sign(payload, env.EMAIL_VERIFY_SECRET, { expiresIn: "15m" });
}
export function verifyDownloadToken(token) {
    return jwt.verify(token, env.EMAIL_VERIFY_SECRET);
}
//# sourceMappingURL=digitalproduct.service.js.map