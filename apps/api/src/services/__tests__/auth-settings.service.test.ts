import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ group: vi.fn(), fetch: vi.fn() }));
vi.mock("../settings.service.js", () => ({ getDecryptedGroup: mock.group }));
vi.mock("../otp.service.js", () => ({ phoneAuthOptions: vi.fn(async () => ({ login: false, verification: false, passwordReset: false, registrationRequired: false })) }));
vi.mock("../../config/env.js", () => ({ env: { NEXT_PUBLIC_APP_URL: "https://shop.example.test" } }));
import { publicAuthOptions, verifyRegistrationCaptcha } from "../auth-settings.service.js";

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", mock.fetch); });
afterEach(() => vi.unstubAllGlobals());

describe("runtime authentication settings", () => {
  it("exposes configured provider names and a CAPTCHA site key without exposing secrets", async () => {
    mock.group.mockImplementation(async (group: string) => group === "socialLogin"
      ? { googleEnabled: true, googleClientId: "client", googleClientSecret: "private-provider-secret", facebookEnabled: false, twitterEnabled: false }
      : { enabled: true, siteKey: "public-site-key", secretKey: "private-captcha-secret" });
    const options = await publicAuthOptions();
    expect(options.providers).toEqual(["google"]);
    expect(options.recaptcha.siteKey).toBe("public-site-key");
    expect(JSON.stringify(options)).not.toContain("private-");
  });

  it("requires verification before a configured registration and binds success to this store's hostname", async () => {
    mock.group.mockResolvedValue({ enabled: true, siteKey: "site", secretKey: "secret" });
    await expect(verifyRegistrationCaptcha()).rejects.toThrow(/Complete/);
    expect(mock.fetch).not.toHaveBeenCalled();
    mock.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, hostname: "attacker.example.test" }) });
    await expect(verifyRegistrationCaptcha("token")).rejects.toThrow(/invalid/);
    mock.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, hostname: "shop.example.test" }) });
    await expect(verifyRegistrationCaptcha("fresh-token")).resolves.toBeUndefined();
  });

  it("fails closed during provider outages while allowing registrations when CAPTCHA is disabled", async () => {
    mock.group.mockResolvedValue({ enabled: true, siteKey: "site", secretKey: "secret" });
    mock.fetch.mockRejectedValue(new Error("Offline"));
    await expect(verifyRegistrationCaptcha("token")).rejects.toThrow(/temporarily unavailable/);
    mock.group.mockResolvedValue({ enabled: false });
    await expect(verifyRegistrationCaptcha()).resolves.toBeUndefined();
  });
});
