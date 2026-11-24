import { Schema, model, type InferSchemaType } from "mongoose";
import { withJsonId } from "./plugins.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "staff", "seller", "customer"],
      default: "customer",
      index: true,
    },
    permissions: { type: [String], default: undefined }, // named RBAC perms, staff only
    avatarUrl: String,
    banned: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    provider: { type: String, enum: ["credentials", "google", "facebook"], default: "credentials" },
    providerId: { type: String, index: true, sparse: true },
    clubPoints: { type: Number, default: 0 },
    financeRevision: { type: Number, default: 0, select: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Classified-listing allowance bought through a customer package (legacy
    // `users.remaining_uploads`), consumed one per listing.
    customerPackageId: { type: Schema.Types.ObjectId, ref: "CustomerPackage", default: null },
    remainingUploads: { type: Number, default: 0, min: 0 },
    packageInvalidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, banned: 1 });
withJsonId(userSchema);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
