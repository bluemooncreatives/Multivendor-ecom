import { randomUUID } from "node:crypto";
import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
// One document per issued refresh token; rotated (deleted + reissued) on every use
// so a stolen token can't be replayed after the legitimate client refreshes.
// _id is a UUID string (not the default ObjectId) so it can double as the JWT `jti` claim.
const refreshTokenSchema = new Schema({
    _id: { type: String, default: () => randomUUID() },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
    userAgent: String,
    ip: String,
}, { timestamps: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
withJsonId(refreshTokenSchema);
export const RefreshToken = model("RefreshToken", refreshTokenSchema);
//# sourceMappingURL=RefreshToken.js.map