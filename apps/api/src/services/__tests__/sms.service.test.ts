import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ settings: {} as Record<string, unknown>, message: vi.fn(), twilio: vi.fn(), fetch: vi.fn() }));
vi.mock("../../models/Settings.js", () => ({ OtpSetting: {
  findOneAndUpdate: vi.fn(() => ({ select: vi.fn(async () => mocks.settings) })),
} }));
vi.mock("../../config/env.js", () => ({ env: { SETTINGS_ENCRYPTION_KEY: "sms-test-settings-encryption-32bytes" } }));
vi.mock("../../config/logger.js", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));
vi.mock("twilio", () => ({ default: mocks.twilio }));
import { getSmsSender, sendBulkSms } from "../sms.service.js";
import { encryptSecret } from "../../utils/secrets.js";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.settings = { provider: "none", credentials: {} };
  mocks.twilio.mockReturnValue({ messages: { create: mocks.message } });
  mocks.message.mockResolvedValue({ status: "queued" });
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

function response(body: unknown, ok = true) { mocks.fetch.mockResolvedValue({ ok, json: async () => body }); }

describe("configured SMS providers", () => {
  it("rejects disabled or incomplete settings before contacting a provider", async () => {
    await expect(getSmsSender()).rejects.toThrow(/No SMS provider/);
    mocks.settings = { provider: "nexmo", credentials: { apiKey: "key" } };
    await expect(getSmsSender()).rejects.toThrow(/API secret/);
    expect(mocks.twilio).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("uses encrypted Twilio credentials, deduplicates recipients and counts partial failures", async () => {
    mocks.settings = { provider: "twilio", senderId: "+12025550100", credentials: { accountSid: encryptSecret("AC-test"), authToken: encryptSecret("private-token") } };
    mocks.message.mockResolvedValueOnce({ status: "queued" }).mockRejectedValueOnce(new Error("private provider error"));
    expect(await sendBulkSms(["+919000000001", "+919000000001", "+919000000002"], "Hello")).toEqual({ sent: 1, failed: 1 });
    expect(mocks.twilio).toHaveBeenCalledWith("AC-test", "private-token", expect.objectContaining({ autoRetry: false }));
    expect(mocks.message).toHaveBeenCalledTimes(2);
  });

  it("sends Unicode through Vonage and treats a provider error inside HTTP 200 as failure", async () => {
    mocks.settings = { provider: "nexmo", senderId: "Store", credentials: { apiKey: "key", apiSecret: "secret" } };
    response({ messages: [{ status: "0" }] });
    const send = await getSmsSender();
    await send("+919000000001", "Hello नमस्ते");
    const [url, init] = mocks.fetch.mock.calls[0]!;
    expect(url).toBe("https://rest.nexmo.com/sms/json");
    expect(init.body.get("to")).toBe("919000000001");
    expect(init.body.get("type")).toBe("unicode");
    expect(mocks.twilio).not.toHaveBeenCalled();
    response({ messages: [{ status: "4" }] });
    await expect(send("+919000000001", "Hello")).rejects.toThrow(/rejected/);
  });

  it("checks both SSL Wireless request and recipient status", async () => {
    mocks.settings = { provider: "ssl_wireless", credentials: { apiKey: "token", sid: "sid" } };
    response({ status: "SUCCESS", status_code: 200, smsinfo: [{ sms_status: "SUCCESS" }] });
    const send = await getSmsSender();
    await send("+8801900000001", "Hello");
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body)).toMatchObject({ api_token: "token", sid: "sid", msisdn: "8801900000001", sms: "Hello" });
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body).csms_id).toMatch(/^[a-z0-9]{20}$/);
    response({ status: "SUCCESS", status_code: 200, smsinfo: [{ sms_status: "BLOCKED" }] });
    await expect(send("+8801900000001", "Hello")).rejects.toThrow(/rejected/);
  });

  it("uses MSG91 instead of silently sending through Twilio", async () => {
    mocks.settings = { provider: "msg91", senderId: "STORE", credentials: { apiKey: "key" } };
    response({ type: "success" });
    await (await getSmsSender())("+919000000001", "Hello");
    expect(mocks.fetch.mock.calls[0]![0]).toBe("https://api.msg91.com/api/v2/sendsms");
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body).sms[0]).toMatchObject({ message: "Hello", to: ["919000000001"] });
    expect(mocks.twilio).not.toHaveBeenCalled();
  });

  it("supports the legacy Fast2SMS provider through its current Quick SMS endpoint", async () => {
    mocks.settings = { provider: "fast2sms", credentials: { apiKey: "key" } };
    response({ return: true });
    const send = await getSmsSender();
    await send("+919000000001", "Hello");
    expect(mocks.fetch.mock.calls[0]![0]).toBe("https://www.fast2sms.com/dev/bulkV2");
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body)).toEqual({ route: "q", message: "Hello", numbers: "9000000001" });
    await expect(send("+12025550100", "Hello")).rejects.toThrow(/Indian/);
  });

  it("requires Fast2SMS DLT metadata before making a request", async () => {
    mocks.settings = { provider: "fast2sms", credentials: { apiKey: "key", route: "dlt_manual" } };
    await expect(getSmsSender()).rejects.toThrow(/sender/);
    mocks.settings = { provider: "fast2sms", credentials: { apiKey: "key", route: "dlt_manual", from: "STORE", entityId: "entity", templateId: "template" } };
    response({ return: true });
    await (await getSmsSender())("+919000000001", "Approved template text");
    expect(JSON.parse(mocks.fetch.mock.calls[0]![1].body)).toMatchObject({ route: "dlt_manual", sender_id: "STORE", entity_id: "entity", template_id: "template" });
  });

  it("rejects invalid phone numbers and HTTP failures without exposing provider data", async () => {
    mocks.settings = { provider: "msg91", senderId: "STORE", credentials: { apiKey: "key" } };
    const send = await getSmsSender();
    await expect(send("9000000001", "Hello")).rejects.toThrow(/international/);
    expect(mocks.fetch).not.toHaveBeenCalled();
    response({ error: "private credential details" }, false);
    await expect(send("+919000000001", "Hello")).rejects.toThrow("The SMS provider could not accept the message");
  });
});
