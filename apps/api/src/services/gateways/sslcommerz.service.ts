import axios from "axios";
import { env } from "../../config/env.js";
import { getGatewayCredentials, getPendingOrderOrThrow, recordPendingPayment } from "./shared.js";
import * as paymentService from "../payment.service.js";
import { ApiError } from "../../middleware/errorHandler.js";

interface SslcommerzCreds {
  storeId: string;
  storePassword: string;
  sandbox?: boolean;
}

function baseUrl(sandbox?: boolean) {
  return sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
}

// Bangladesh gateway: session-init call returns a hosted GatewayPageURL to
// redirect the shopper to; the actual payment result arrives at ipn_url (server
// to server) plus success/fail/cancel redirects (browser).
export async function createSslcommerzSession(orderId: string) {
  const order = await getPendingOrderOrThrow(orderId);
  const creds = await getGatewayCredentials<SslcommerzCreds>("sslcommerz");

  const addr = order.addressSnapshot as Record<string, string>;
  const { data } = await axios.post(
    `${baseUrl(creds.sandbox)}/gwprocess/v4/api.php`,
    new URLSearchParams({
      store_id: creds.storeId,
      store_passwd: creds.storePassword,
      total_amount: String(order.grandTotal),
      currency: order.currency,
      tran_id: String(order._id),
      success_url: `${env.API_PUBLIC_URL}/api/v1/payments/sslcommerz/success/${order._id}`,
      fail_url: `${env.API_PUBLIC_URL}/api/v1/payments/sslcommerz/fail/${order._id}`,
      cancel_url: `${env.API_PUBLIC_URL}/api/v1/payments/sslcommerz/cancel/${order._id}`,
      ipn_url: `${env.API_PUBLIC_URL}/api/v1/payments/sslcommerz/ipn/${order._id}`,
      cus_name: addr.line1 ?? "Customer",
      cus_email: "customer@example.com",
      cus_add1: addr.line1 ?? "",
      cus_city: addr.city ?? "",
      cus_postcode: addr.postalCode ?? "",
      cus_country: addr.country ?? "",
      cus_phone: addr.phone ?? "",
      shipping_method: "NO",
      product_name: "Order",
      product_category: "General",
      product_profile: "general",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  if (data.status !== "SUCCESS") throw new ApiError(502, "SSLCommerz session initiation failed");
  await recordPendingPayment(orderId, "sslcommerz", order.grandTotal, order.currency, data.sessionkey);
  return { redirectUrl: data.GatewayPageURL as string };
}

export async function validateSslcommerzPayment(valId: string, orderId: string) {
  const creds = await getGatewayCredentials<SslcommerzCreds>("sslcommerz");
  const { data } = await axios.get(`${baseUrl(creds.sandbox)}/validator/api/validationserverAPI.php`, {
    params: { val_id: valId, store_id: creds.storeId, store_passwd: creds.storePassword, format: "json" },
  });

  if (data.status === "VALID" || data.status === "VALIDATED") {
    await paymentService.settleOrderPayment(orderId, "sslcommerz", valId);
  } else {
    await paymentService.failOrderPayment(orderId, "sslcommerz");
  }
}
