import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { PaymentGateway } from "../models/PaymentGateway.js";
import { GatewayIntent } from "../models/GatewayIntent.js";
import { SellerPackage, CustomerPackage } from "../models/Package.js";
import * as sslcommerz from "../services/gateways/sslcommerz.service.js";
import * as instamojo from "../services/gateways/instamojo.service.js";
import * as paystack from "../services/gateways/paystack.service.js";
import * as voguepay from "../services/gateways/voguepay.service.js";
import * as payhere from "../services/gateways/payhere.service.js";
import * as ngenius from "../services/gateways/ngenius.service.js";
import * as paytm from "../services/gateways/paytm.service.js";
import * as mpesa from "../services/gateways/mpesa.service.js";
import * as flutterwave from "../services/gateways/flutterwave.service.js";
import * as twocheckout from "../services/gateways/twocheckout.service.js";
import * as paymentService from "../services/payment.service.js";
import { mergeSecrets } from "../utils/secrets.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";

// --- Session/order creation (called from the checkout UI) --------------------

export async function createSslcommerzSessionHandler(req: Request, res: Response) {
  res.json(await sslcommerz.createSslcommerzSession(String(req.params.orderId)));
}
export async function createInstamojoRequestHandler(req: Request, res: Response) {
  res.json(await instamojo.createInstamojoRequest(String(req.params.orderId)));
}
export async function createPaystackTransactionHandler(req: Request, res: Response) {
  res.json(await paystack.createPaystackTransaction(String(req.params.orderId)));
}
export async function createVoguePaySessionHandler(req: Request, res: Response) {
  res.json(await voguepay.createVoguePaySession(String(req.params.orderId)));
}
export async function createPayhereSessionHandler(req: Request, res: Response) {
  res.json(await payhere.createPayhereSession(String(req.params.orderId)));
}
export async function createNgeniusOrderHandler(req: Request, res: Response) {
  res.json(await ngenius.createNgeniusOrder(String(req.params.orderId)));
}

// --- Callbacks (hit by the gateway itself, not the frontend) ------------------

export async function sslcommerzSuccessHandler(req: Request, res: Response) {
  await sslcommerz.validateSslcommerzPayment(String(req.body.val_id), String(req.params.orderId));
  res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed?code=${req.body.tran_id}`);
}
export async function sslcommerzFailOrCancelHandler(req: Request, res: Response) {
  await paymentService.failOrderPayment(String(req.params.orderId), "sslcommerz");
  res.redirect(`${req.protocol}://${req.get("host")}/en/checkout`);
}
export async function sslcommerzIpnHandler(req: Request, res: Response) {
  await sslcommerz.validateSslcommerzPayment(String(req.body.val_id), String(req.params.orderId));
  res.status(200).send("OK");
}

export async function instamojoRedirectHandler(req: Request, res: Response) {
  const { payment_request_id, payment_id } = req.query as Record<string, string>;
  if (payment_request_id && payment_id) {
    await instamojo.confirmInstamojoPayment(payment_request_id, payment_id, String(req.params.orderId));
  }
  res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed`);
}

export async function paystackCallbackHandler(req: Request, res: Response) {
  const reference = String(req.query.reference ?? req.params.orderId);
  await paystack.verifyPaystackTransaction(reference, String(req.params.orderId));
  res.redirect(`${req.protocol}://${req.get("host")}/en/checkout/order-confirmed`);
}

export const voguePayNotifySchema = z.object({ transaction_id: z.string().optional(), status: z.string() });
export async function voguePayNotifyHandler(req: Request, res: Response) {
  await voguepay.handleVoguePayNotify(String(req.params.orderId), String(req.body.status));
  res.status(200).send("OK");
}

export async function payhereNotifyHandler(req: Request, res: Response) {
  await payhere.verifyPayhereNotify({
    orderId: String(req.params.orderId),
    paymentId: String(req.body.payment_id),
    amount: String(req.body.payhere_amount),
    currency: String(req.body.payhere_currency),
    statusCode: String(req.body.status_code),
    merchantId: String(req.body.merchant_id),
    receivedSig: String(req.body.md5sig),
  });
  res.status(200).send("OK");
}

export const confirmNgeniusSchema = z.object({ reference: z.string() });
export async function confirmNgeniusHandler(req: Request, res: Response) {
  await ngenius.confirmNgeniusOrder(req.body.reference, String(req.params.orderId));
  res.status(204).send();
}

// --- Paytm ---------------------------------------------------------------------

export async function createPaytmSessionHandler(req: Request, res: Response) {
  res.json(await paytm.createPaytmSession(String(req.params.orderId)));
}

export async function paytmCallbackHandler(req: Request, res: Response) {
  await paytm.handlePaytmCallback(String(req.params.orderId), req.body as Record<string, string>);
  res.redirect(`${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed`);
}

// --- M-Pesa --------------------------------------------------------------------

export const mpesaPushSchema = z.object({ phone: z.string().min(9).max(15) });

export async function createMpesaPushHandler(req: Request, res: Response) {
  res.json(await mpesa.createMpesaStkPush(String(req.params.orderId), req.body.phone));
}

// Safaricom retries until it gets a 200, so this always acknowledges: a non-200
// would have them replay a result already recorded.
export async function mpesaCallbackHandler(req: Request, res: Response) {
  await mpesa.handleMpesaCallback(String(req.params.orderId), req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
}

// --- Flutterwave ----------------------------------------------------------------

export async function createFlutterwaveSessionHandler(req: Request, res: Response) {
  res.json(await flutterwave.createFlutterwavePayment(String(req.params.orderId)));
}

export async function flutterwaveCallbackHandler(req: Request, res: Response) {
  const { transaction_id, status } = req.query as Record<string, string>;

  const settled =
    status === "successful" && transaction_id
      ? await flutterwave.verifyFlutterwaveTransaction(String(req.params.orderId), transaction_id)
      : false;

  res.redirect(
    settled ? `${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed` : `${env.NEXT_PUBLIC_APP_URL}/en/checkout?failed=1`,
  );
}

export async function flutterwaveWebhookHandler(req: Request, res: Response) {
  const valid = await flutterwave.verifyFlutterwaveWebhookHash(req.headers["verif-hash"] as string | undefined);
  if (!valid) throw new ApiError(401, "Invalid webhook signature");

  const orderId = req.body?.data?.tx_ref;
  const transactionId = req.body?.data?.id;
  if (orderId && transactionId) {
    await flutterwave.verifyFlutterwaveTransaction(String(orderId), String(transactionId));
  }
  res.status(200).send("OK");
}

// --- 2Checkout -------------------------------------------------------------------

export async function createTwoCheckoutSessionHandler(req: Request, res: Response) {
  res.json(await twocheckout.createTwoCheckoutSession(String(req.params.orderId)));
}

export async function twoCheckoutCallbackHandler(req: Request, res: Response) {
  await twocheckout.handleTwoCheckoutCallback(String(req.params.orderId), req.body as Record<string, string>);
  res.redirect(`${env.NEXT_PUBLIC_APP_URL}/en/checkout/order-confirmed`);
}

// --- Non-order payables ----------------------------------------------------------

export const createIntentSchema = z.object({
  purpose: z.enum(["wallet_recharge", "seller_package", "customer_package"]),
  /** Required for package purchases; ignored for a wallet top-up. */
  packageId: z.string().optional(),
  /** Required for a wallet top-up; the package price is used otherwise. */
  amount: z.number().min(1).optional(),
  paymentMethod: z.string().min(1),
});

/**
 * Creates a payable for something that is not an order, so the same gateway
 * session endpoints can be used to pay for it. The amount is taken from the
 * package where one applies, never from the client.
 */
export async function createGatewayIntentHandler(req: Request, res: Response) {
  const { purpose, packageId, amount, paymentMethod } = req.body as z.infer<typeof createIntentSchema>;

  let total: number;
  let refId: string | null = null;

  if (purpose === "wallet_recharge") {
    if (!amount) throw new ApiError(400, "An amount is required for a wallet top-up");
    total = amount;
  } else {
    if (!packageId) throw new ApiError(400, "A package is required");
    const pkg =
      purpose === "seller_package"
        ? await SellerPackage.findById(packageId)
        : await CustomerPackage.findById(packageId);

    if (!pkg || !pkg.active) throw new ApiError(404, "That package is not available");
    total = pkg.price;
    refId = String(pkg._id);
  }

  const intent = await GatewayIntent.create({
    purpose,
    userId: req.user!.id,
    refId,
    code: `PAY-${randomUUID().slice(0, 12).toUpperCase()}`,
    grandTotal: total,
    currency: "INR",
    paymentMethod,
    paymentStatus: "pending",
  });

  res.status(201).json({ id: String(intent._id), code: intent.code, grandTotal: intent.grandTotal });
}

// --- Admin gateway credential management --------------------------------------

const GATEWAY_CODES = [
  "sslcommerz",
  "instamojo",
  "paystack",
  "voguepay",
  "payhere",
  "ngenius",
  "paytm",
  "mpesa",
  "flutterwave",
  "twocheckout",
] as const;

export const gatewayConfigSchema = z.object({
  enabled: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  credentials: z.record(z.unknown()).optional(),
});

// `credentials` is select:false, so this list never carries keys — the UI only
// learns which fields are set, from `configuredFields`.
export async function listGatewayConfigsHandler(_req: Request, res: Response) {
  const gateways = await PaymentGateway.find().select("+credentials").lean();
  res.json({
    items: gateways.map((gateway) => ({
      id: String(gateway._id),
      code: gateway.code,
      enabled: gateway.enabled,
      sandbox: gateway.sandbox,
      configuredFields: Object.keys((gateway.credentials ?? {}) as Record<string, unknown>),
    })),
  });
}

export async function upsertGatewayConfigHandler(req: Request, res: Response) {
  const code = String(req.params.code);
  if (!(GATEWAY_CODES as readonly string[]).includes(code)) throw new ApiError(404, "Unknown gateway");

  const existing = await PaymentGateway.findOne({ code }).select("+credentials");

  // Credentials are merged and encrypted: an omitted field keeps its stored
  // value, so the form can be saved without ever having received the secrets.
  const credentials = req.body.credentials
    ? mergeSecrets(
        (existing?.credentials ?? {}) as Record<string, unknown>,
        req.body.credentials as Record<string, unknown>,
        Object.keys(req.body.credentials as Record<string, unknown>),
      )
    : undefined;

  const gateway = await PaymentGateway.findOneAndUpdate(
    { code },
    {
      code,
      ...(req.body.enabled !== undefined ? { enabled: req.body.enabled } : {}),
      ...(req.body.sandbox !== undefined ? { sandbox: req.body.sandbox } : {}),
      ...(credentials ? { credentials } : {}),
    },
    { upsert: true, new: true },
  );
  // Echo the same shape the list returns, so the browser never receives a key
  // back even immediately after saving one.
  res.json({
    id: String(gateway._id),
    code: gateway.code,
    enabled: gateway.enabled,
    sandbox: gateway.sandbox,
    configuredFields: Object.keys((gateway.credentials ?? {}) as Record<string, unknown>),
  });
}
