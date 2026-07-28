import { ApiError } from "./errorHandler.js";
export function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const fields = {};
            for (const issue of result.error.issues) {
                fields[issue.path.join(".") || "_"] = issue.message;
            }
            return next(new ApiError(422, "Validation failed", "VALIDATION_ERROR", fields));
        }
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map