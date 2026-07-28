import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
export function signEmailVerificationToken(userId) {
    return jwt.sign({ sub: userId, purpose: "verify-email" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "6h" });
}
export function verifyEmailVerificationToken(token) {
    const decoded = jwt.verify(token, env.EMAIL_VERIFY_SECRET);
    if (decoded.purpose !== "verify-email")
        throw new Error("Invalid token purpose");
    return decoded;
}
export function signPasswordResetToken(userId) {
    return jwt.sign({ sub: userId, purpose: "reset-password" }, env.EMAIL_VERIFY_SECRET, { expiresIn: "1h" });
}
export function verifyPasswordResetToken(token) {
    const decoded = jwt.verify(token, env.EMAIL_VERIFY_SECRET);
    if (decoded.purpose !== "reset-password")
        throw new Error("Invalid token purpose");
    return decoded;
}
//# sourceMappingURL=jwt.js.map