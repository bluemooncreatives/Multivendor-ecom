type Messages = { [key: string]: string | Messages };

/** Apply flat editor keys such as nav.shop to the shipped nested messages. */
export function mergeTranslationOverrides(baseline: Messages, overrides: Record<string, unknown>): Messages {
  const result = structuredClone(baseline);
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "string" || !value) continue;
    const parts = key.split(".");
    if (parts.some((part) => !part || ["__proto__", "prototype", "constructor"].includes(part))) continue;
    let current = result;
    for (const part of parts.slice(0, -1)) {
      if (!Object.hasOwn(current, part) || typeof current[part] !== "object") {
        current = {};
        break;
      }
      current = current[part] as Messages;
    }
    const leaf = parts[parts.length - 1]!;
    // Only replace shipped strings; arbitrary legacy keys cannot replace a
    // namespace or introduce objects where next-intl expects a message.
    if (Object.hasOwn(current, leaf) && typeof current[leaf] === "string") current[leaf] = value;
  }
  return result;
}
