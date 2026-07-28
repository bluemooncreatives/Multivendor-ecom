import type { Schema } from "mongoose";

// Normalizes every model's JSON output: expose `id` instead of `_id`/`__v`.
export function withJsonId(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
}
