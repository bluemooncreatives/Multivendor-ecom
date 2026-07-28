import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "./errorHandler.js";
// Every mutating/ownership-scoped route reads req.user.id off the verified JWT —
// never a client-supplied user_id field (the legacy app's core IDOR bug).
export function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(new ApiError(401, "Authentication required"));
    }
    try {
        const payload = verifyAccessToken(header.slice("Bearer ".length));
        req.user = { id: payload.sub, role: payload.role, permissions: payload.permissions };
        next();
    }
    catch {
        next(new ApiError(401, "Invalid or expired token"));
    }
}
export function optionalAuthenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return next();
    try {
        const payload = verifyAccessToken(header.slice("Bearer ".length));
        req.user = { id: payload.sub, role: payload.role, permissions: payload.permissions };
    }
    catch {
        // Ignore invalid tokens on optional routes (e.g. guest cart) instead of rejecting.
    }
    next();
}
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new ApiError(401, "Authentication required"));
        if (!roles.includes(req.user.role))
            return next(new ApiError(403, "Forbidden"));
        next();
    };
}
// Staff members pass this check only if explicitly granted the named permission —
// there is no blanket "staff bypasses everything" shortcut.
export function requirePermission(permission) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new ApiError(401, "Authentication required"));
        if (req.user.role === "admin")
            return next();
        if (req.user.role === "staff" && req.user.permissions?.includes(permission))
            return next();
        return next(new ApiError(403, "Forbidden"));
    };
}
//# sourceMappingURL=auth.js.map