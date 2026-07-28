// Express 4 does not catch rejected promises from async route handlers on its own;
// this forwards any thrown/rejected error to the centralized error middleware.
export function asyncHandler(handler) {
    return (req, res, next) => {
        handler(req, res).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map