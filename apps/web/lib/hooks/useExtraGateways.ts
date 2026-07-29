"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";

/** Gateways that hand back a URL to send the browser to. */
export type RedirectGateway =
  | "sslcommerz"
  | "instamojo"
  | "paystack"
  | "voguepay"
  | "ngenius"
  | "flutterwave"
  | "stripe";

/** Gateways reached by auto-submitting an HTML form rather than a link. */
export type FormPostGateway = "payhere" | "paytm" | "twocheckout";

function useGatewayHeaders() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestId = useGuestStore((s) => s.guestId);
  return accessToken ? {} : { "X-Guest-Id": guestId };
}

// Every redirect gateway follows the same contract: create a session against the
// already-created order, then send the browser to the returned hosted page.
// Stripe joins them via a Checkout Session, so no card data touches this app.
export function useCreateGatewaySession(gateway: RedirectGateway) {
  const headers = useGatewayHeaders();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const url = gateway === "stripe" ? `/payments/${orderId}/stripe/checkout` : `/payments/${gateway}/${orderId}/session`;
      return (await api.post<{ redirectUrl: string }>(url, {}, { headers })).data;
    },
  });
}

// Payhere, Paytm and 2Checkout all require an HTML form POST — the API returns
// the target URL plus the exact signed fields to submit.
export function useCreateFormPostSession(gateway: FormPostGateway) {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (
        await api.post<{ actionUrl: string; fields: Record<string, string> }>(
          `/payments/${gateway}/${orderId}/session`,
          {},
          { headers },
        )
      ).data,
  });
}

/** @deprecated Use useCreateFormPostSession("payhere"). */
export function useCreatePayhereSession() {
  return useCreateFormPostSession("payhere");
}

/**
 * Razorpay opens a modal on this page rather than redirecting, so the order is
 * created here and the modal reports back. Settlement is still the webhook's
 * job — the handler below only tells the shopper what happened.
 */
export function useCreateRazorpayOrder() {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (
        await api.post<{ razorpayOrderId: string; amount: number; currency: string }>(
          `/payments/${orderId}/razorpay/order`,
          {},
          { headers },
        )
      ).data,
  });
}

/** M-Pesa prompts the customer's handset; nothing redirects. */
export function useCreateMpesaPush() {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async ({ orderId, phone }: { orderId: string; phone: string }) =>
      (
        await api.post<{ checkoutRequestId: string; message: string }>(
          `/payments/mpesa/${orderId}/session`,
          { phone },
          { headers },
        )
      ).data,
  });
}

export function useCreatePaypalOrder() {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (await api.post<{ paypalOrderId: string }>(`/payments/${orderId}/paypal/order`, {}, { headers })).data,
  });
}

export function useCapturePaypalOrder() {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async ({ orderId, paypalOrderId }: { orderId: string; paypalOrderId: string }) =>
      (await api.post(`/payments/${orderId}/paypal/capture`, { paypalOrderId }, { headers })).data,
  });
}

export function submitAutoForm(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

/**
 * Loads a gateway's browser SDK on demand (Razorpay Checkout, PayPal Buttons).
 * Resolves immediately if the script is already on the page, so re-opening the
 * payment step does not add a second copy.
 */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.body.appendChild(script);
  });
}
