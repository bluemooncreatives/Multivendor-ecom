import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

const smsOutboxSchema = new Schema({
  _id: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  kind: { type: String, enum: ["placed", "delivery", "payment"], required: true },
  state: { type: String, required: true },
  shipmentKey: { type: String, default: "all" },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["queued", "sending", "sent", "failed", "cancelled"], default: "queued" },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  leaseUntil: { type: Date, default: () => new Date(0) },
  owner: { type: String, default: null, select: false },
  acceptedAt: { type: Date, default: null },
  lastError: { type: String, default: null },
}, { timestamps: true });
smsOutboxSchema.index({ status: 1, nextAttemptAt: 1, leaseUntil: 1 });
withJsonId(smsOutboxSchema);
export const SmsOutbox = model("SmsOutbox", smsOutboxSchema);
