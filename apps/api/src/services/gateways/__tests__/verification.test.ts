import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../config/env.js", () => ({ env: { API_PUBLIC_URL: "https://api.test", NEXT_PUBLIC_APP_URL: "https://web.test" } }));
vi.mock("../../../config/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../shared.js", () => ({ getGateway: vi.fn(), getGatewayCredentials: vi.fn(), getPendingOrderOrThrow: vi.fn(), recordPendingPayment: vi.fn(), assertVerifiedPayment: vi.fn() }));
vi.mock("../../payment.service.js", () => ({ settleOrderPayment: vi.fn(), failOrderPayment: vi.fn() }));

import axios from "axios";
import { getGateway, getGatewayCredentials, assertVerifiedPayment } from "../shared.js";
import { settleOrderPayment, failOrderPayment } from "../../payment.service.js";
import { handleVoguePayNotify } from "../voguepay.service.js";
import { verifyPaystackTransaction } from "../paystack.service.js";
import { generateChecksum, handlePaytmCallback } from "../paytm.service.js";
import { confirmNgeniusOrder } from "../ngenius.service.js";

beforeEach(() => vi.resetAllMocks());

describe("provider verification before settlement", () => {
  it("does not accept a VoguePay success flag without a verified transaction", async () => {
    await expect(handleVoguePayNotify("order", "")).rejects.toThrow(/transaction id/);
    expect(settleOrderPayment).not.toHaveBeenCalled();
  });

  it("rejects a real VoguePay transaction belonging to another order", async () => {
    vi.mocked(getGatewayCredentials).mockResolvedValue({ merchantId: "merchant" });
    vi.mocked(axios.get).mockResolvedValue({ data: { merchant_id: "merchant", merchant_ref: "other-order", transaction_id: "transaction", status: "Approved" } });
    await expect(handleVoguePayNotify("order", "transaction")).rejects.toThrow(/does not belong/);
    expect(settleOrderPayment).not.toHaveBeenCalled();
  });

  it("checks Paystack amount, currency and local reference before settling", async () => {
    vi.mocked(getGatewayCredentials).mockResolvedValue({ secretKey: "test" });
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { status: "success", reference: "transaction", amount: 100, currency: "NGN" } } });
    vi.mocked(assertVerifiedPayment).mockRejectedValue(new Error("Wrong amount"));
    await expect(verifyPaystackTransaction("transaction", "order")).rejects.toThrow(/Wrong amount/);
    expect(assertVerifiedPayment).toHaveBeenCalledWith("order", "paystack", 1, "NGN", "transaction");
    expect(settleOrderPayment).not.toHaveBeenCalled();
  });

  it("ignores an unconfirmed Paystack transaction without cancelling an unrelated order", async () => {
    vi.mocked(getGatewayCredentials).mockResolvedValue({ secretKey: "test" });
    vi.mocked(axios.get).mockResolvedValue({ data: { data: { status: "failed" } } });
    await expect(verifyPaystackTransaction("unknown", "order")).rejects.toThrow(/not confirmed/);
    expect(failOrderPayment).not.toHaveBeenCalled();
  });

  it("rejects an unsigned Paytm callback without releasing stock", async () => {
    vi.mocked(getGateway).mockResolvedValue({ creds: { merchantKey: "1234567890123456", merchantId: "merchant" }, sandbox: true });
    await expect(handlePaytmCallback("order", { STATUS: "TXN_SUCCESS" })).rejects.toThrow(/checksum/);
    expect(failOrderPayment).not.toHaveBeenCalled();
    expect(settleOrderPayment).not.toHaveBeenCalled();
  });

  it("rejects a signed Paytm callback replayed against another order", async () => {
    const key = "1234567890123456";
    vi.mocked(getGateway).mockResolvedValue({ creds: { merchantKey: key, merchantId: "merchant" }, sandbox: true });
    const params = { MID: "merchant", ORDERID: "other", TXNAMOUNT: "50.00", CURRENCY: "INR", STATUS: "TXN_SUCCESS" };
    await expect(handlePaytmCallback("order", { ...params, CHECKSUMHASH: generateChecksum(params, key) })).rejects.toThrow(/reference/);
    expect(settleOrderPayment).not.toHaveBeenCalled();
  });

  it("keeps an authorised N-Genius payment pending until capture", async () => {
    vi.mocked(getGatewayCredentials).mockResolvedValue({ apiKey: "test", outletId: "outlet", sandbox: true });
    vi.mocked(axios.post).mockResolvedValue({ data: { access_token: "test" } });
    vi.mocked(axios.get).mockResolvedValue({ data: { amount: { value: 5000, currencyCode: "AED" }, _embedded: { payment: [{ state: "AUTHORISED" }] } } });
    await confirmNgeniusOrder("reference", "order");
    expect(settleOrderPayment).not.toHaveBeenCalled();
    expect(failOrderPayment).not.toHaveBeenCalled();
  });
});
