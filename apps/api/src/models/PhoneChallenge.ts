import { Schema, model } from "mongoose";

const phoneChallengeSchema = new Schema({
  _id: { type: String, required: true }, // One current challenge per phone, across purposes.
  nonce: { type: String, required: true },
  purpose: { type: String, enum: ["login", "password_reset", "verify_phone", "registration"], required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  codeHash: { type: String, default: null, select: false },
  transport: { type: String, enum: ["sms", "twilio_verify"], required: true },
  status: { type: String, enum: ["pending", "sent", "failed"], required: true },
  attempts: { type: Number, default: 0 },
  consumedAt: { type: Date, default: null },
  resendAfter: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
phoneChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const PhoneChallenge = model("PhoneChallenge", phoneChallengeSchema);
