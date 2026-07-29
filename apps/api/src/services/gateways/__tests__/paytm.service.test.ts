import { describe, it, expect, vi } from "vitest";

vi.mock("../../../config/env.js", () => ({ env: { API_PUBLIC_URL: "https://api.test", NEXT_PUBLIC_APP_URL: "https://app.test" } }));
vi.mock("../../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("../shared.js", () => ({ getGateway: vi.fn(), getPendingOrderOrThrow: vi.fn(), recordPendingPayment: vi.fn() }));
vi.mock("../../payment.service.js", () => ({ settleOrderPayment: vi.fn(), failOrderPayment: vi.fn() }));

const { generateChecksum, verifyChecksum } = await import("../paytm.service.js");

// Paytm's merchant key is 16 characters; only the first 16 are used as the AES key.
const KEY = "test-merchant-key-1234567890";

describe("Paytm checksum", () => {
  const params = { ORDERID: "order-1", TXNAMOUNT: "500.00", STATUS: "TXN_SUCCESS", MID: "MERCHANT1" };

  it("verifies a checksum it generated", () => {
    expect(verifyChecksum(params, KEY, generateChecksum(params, KEY))).toBe(true);
  });

  it("is salted, so the same params produce different checksums", () => {
    expect(generateChecksum(params, KEY)).not.toBe(generateChecksum(params, KEY));
  });

  // The whole point of the checksum: a public callback endpoint must not accept
  // a payload whose amount or status has been edited in transit.
  it("rejects a payload whose amount was altered", () => {
    const checksum = generateChecksum(params, KEY);
    expect(verifyChecksum({ ...params, TXNAMOUNT: "1.00" }, KEY, checksum)).toBe(false);
  });

  it("rejects a payload whose status was altered", () => {
    const checksum = generateChecksum(params, KEY);
    expect(verifyChecksum({ ...params, STATUS: "TXN_FAILURE" }, KEY, checksum)).toBe(false);
  });

  it("rejects a checksum signed with a different merchant key", () => {
    const checksum = generateChecksum(params, "a-completely-different-key-here");
    expect(verifyChecksum(params, KEY, checksum)).toBe(false);
  });

  it("rejects malformed input rather than throwing", () => {
    expect(verifyChecksum(params, KEY, "not-base64-at-all!!")).toBe(false);
    expect(verifyChecksum(params, KEY, "")).toBe(false);
  });

  it("is order-independent, since values are sorted by key before hashing", () => {
    const checksum = generateChecksum(params, KEY);
    const reordered = { STATUS: params.STATUS, MID: params.MID, TXNAMOUNT: params.TXNAMOUNT, ORDERID: params.ORDERID };
    expect(verifyChecksum(reordered, KEY, checksum)).toBe(true);
  });

  it("rejects a payload with an extra field the signature did not cover", () => {
    const checksum = generateChecksum(params, KEY);
    expect(verifyChecksum({ ...params, INJECTED: "x" }, KEY, checksum)).toBe(false);
  });
});
