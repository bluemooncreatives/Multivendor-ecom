import { User } from "../models/User.js";

/** Verified ownership wins; an unverified email account is never identified by its phone. */
export async function findPhoneIdentity(phone: string, includePassword = false) {
  const selection = includePassword ? "+passwordHash" : "";
  const verified = await User.find({ phone, phoneVerifiedAt: { $type: "date" } }).select(selection).limit(2);
  if (verified.length) return verified.length === 1 ? verified[0]! : null;
  // PHP allowed phone-only signups before verification. Preserve recovery for a
  // single such account, while refusing ambiguous historical duplicates.
  const legacy = await User.find({ phone, $or: [{ email: { $exists: false } }, { email: null }, { email: "" }] }).select(selection).limit(2);
  return legacy.length === 1 ? legacy[0]! : null;
}
