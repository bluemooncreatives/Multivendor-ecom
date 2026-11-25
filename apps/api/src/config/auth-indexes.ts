export const AUTH_INDEXES = [
  { key: { email: 1 }, options: { name: "email_login_unique", unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" } } } },
  { key: { phone: 1 }, options: { name: "verified_phone_login_unique", unique: true,
    partialFilterExpression: { phone: { $type: "string", $gt: "" }, phoneVerifiedAt: { $type: "date" } } } },
] as const;

interface IndexInfo { name?: string; key: Record<string, unknown>; unique?: boolean; sparse?: boolean; partialFilterExpression?: Record<string, unknown> }
export function obsoleteAuthIndexes(indexes: readonly IndexInfo[]) {
  return indexes.filter((index) => index.unique && Object.keys(index.key).length === 1 && (
    (index.name === "email_1" && index.key.email === 1 && !index.sparse && !index.partialFilterExpression) ||
    (index.name === "phone_login_unique" && index.key.phone === 1 && !index.partialFilterExpression?.phoneVerifiedAt)
  )).map((index) => index.name!);
}
