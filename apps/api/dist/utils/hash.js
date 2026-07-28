import { createHash } from "node:crypto";
// Refresh tokens are high-entropy signed JWTs already, so a fast SHA-256 digest
// (not bcrypt) is sufficient for the DB-side lookup/revocation check.
export function sha256Hex(input) {
    return createHash("sha256").update(input).digest("hex");
}
//# sourceMappingURL=hash.js.map