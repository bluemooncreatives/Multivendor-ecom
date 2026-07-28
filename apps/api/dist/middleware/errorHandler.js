import { logger } from "../config/logger.js";
export class ApiError extends Error {
    status;
    code;
    fields;
    constructor(status, message, code, fields) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
    }
}
export function notFoundHandler(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, req, res, _next) {
    if (err instanceof ApiError) {
        res.status(err.status).json({ message: err.message, code: err.code, fields: err.fields });
        return;
    }
    logger.error("Unhandled error", err);
    res.status(500).json({ message: "Internal server error" });
}
//# sourceMappingURL=errorHandler.js.map