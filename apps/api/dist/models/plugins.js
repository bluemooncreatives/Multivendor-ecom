// Normalizes every model's JSON output: expose `id` instead of `_id`/`__v`.
export function withJsonId(schema) {
    schema.set("toJSON", {
        virtuals: true,
        transform: (_doc, ret) => {
            ret.id = String(ret._id);
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    });
}
//# sourceMappingURL=plugins.js.map