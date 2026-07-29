import { describe, it, expect, vi } from "vitest";

// config/env validates the whole environment at import time and would demand a
// database URI and JWT secrets here, so it is stubbed down to the one key this
// module actually reads.
vi.mock("../../config/env.js", () => ({
  env: { SETTINGS_ENCRYPTION_KEY: "a-test-key-that-is-at-least-32-characters-long" },
}));

vi.mock("../../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { encryptSecret, decryptSecret, isEncrypted, describeSecret, mergeSecrets, maskSecrets, readSecret, CLEAR_SECRET } =
  await import("../secrets.js");

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a value", () => {
    const secret = "sk_live_abcdef1234567890";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("produces different ciphertext each time, so equal secrets are not linkable", () => {
    const a = encryptSecret("same-value");
    const b = encryptSecret("same-value");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("never leaves the plaintext visible in the stored form", () => {
    const stored = encryptSecret("super-secret-token");
    expect(stored).not.toContain("super-secret-token");
    expect(isEncrypted(stored)).toBe(true);
  });

  it("rejects a tampered ciphertext rather than returning garbage", () => {
    const stored = encryptSecret("original");
    const tampered = `${stored.slice(0, -4)}AAAA`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("passes through a value stored before encryption was introduced", () => {
    expect(decryptSecret("legacy-plaintext")).toBe("legacy-plaintext");
  });
});

describe("describeSecret", () => {
  it("reports nothing configured for an empty value", () => {
    expect(describeSecret(null)).toEqual({ configured: false, hint: null });
  });

  it("reveals only the last four characters of a long secret", () => {
    const status = describeSecret(encryptSecret("sk_live_abcdef1234"));
    expect(status.configured).toBe(true);
    expect(status.hint).toBe("••••1234");
  });

  it("reveals nothing at all from a short secret", () => {
    expect(describeSecret(encryptSecret("abc123")).hint).toBe("••••");
  });
});

describe("mergeSecrets", () => {
  const fields = ["password"] as const;

  it("keeps the stored secret when the field is omitted", () => {
    const existing = { host: "smtp.old", password: encryptSecret("stored") };
    const merged = mergeSecrets(existing, { host: "smtp.new" }, fields);

    expect(merged.host).toBe("smtp.new");
    expect(decryptSecret(merged.password as string)).toBe("stored");
  });

  // This is what makes a write-only field workable: the form never receives the
  // value, so submitting an untouched field must not blank it.
  it("keeps the stored secret when the field is submitted empty", () => {
    const existing = { password: encryptSecret("stored") };
    const merged = mergeSecrets(existing, { password: "" }, fields);
    expect(decryptSecret(merged.password as string)).toBe("stored");
  });

  it("encrypts a replacement value", () => {
    const merged = mergeSecrets({ password: encryptSecret("old") }, { password: "new" }, fields);
    expect(isEncrypted(merged.password as string)).toBe(true);
    expect(decryptSecret(merged.password as string)).toBe("new");
  });

  it("clears the secret only on the explicit sentinel", () => {
    const merged = mergeSecrets({ password: encryptSecret("old") }, { password: CLEAR_SECRET }, fields);
    expect(merged.password).toBeNull();
  });

  it("does not encrypt non-secret fields", () => {
    const merged = mergeSecrets({}, { host: "smtp.example", password: "s3cret" }, fields);
    expect(merged.host).toBe("smtp.example");
    expect(isEncrypted(merged.host as string)).toBe(false);
  });
});

describe("maskSecrets", () => {
  it("replaces every secret field with its status and leaves the rest intact", () => {
    const stored = { host: "smtp.example", port: 587, password: encryptSecret("hunter2hunter2") };
    const masked = maskSecrets(stored, ["password"]);

    expect(masked.host).toBe("smtp.example");
    expect(masked.port).toBe(587);
    expect(masked.password).toEqual({ configured: true, hint: "••••ter2" });
  });

  it("never lets a plaintext secret reach the masked output", () => {
    const masked = maskSecrets({ password: encryptSecret("plaintext-value") }, ["password"]);
    expect(JSON.stringify(masked)).not.toContain("plaintext-value");
  });
});

describe("readSecret", () => {
  it("returns the decrypted value for server-side use", () => {
    expect(readSecret({ password: encryptSecret("outbound") }, "password")).toBe("outbound");
  });

  it("returns null when nothing is stored", () => {
    expect(readSecret({}, "password")).toBeNull();
    expect(readSecret({ password: "" }, "password")).toBeNull();
  });
});
