"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";

export type RedirectGateway = "sslcommerz" | "instamojo" | "paystack" | "voguepay" | "ngenius";

function useGatewayHeaders() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestId = useGuestStore((s) => s.guestId);
  return accessToken ? {} : { "X-Guest-Id": guestId };
}

// SSLCommerz / Instamojo / PayStack / VoguePay / N-Genius all follow the same
// contract: create a session against the already-created order, then send the
// browser to the returned hosted-payment URL.
export function useCreateGatewaySession(gateway: RedirectGateway) {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (await api.post<{ redirectUrl: string }>(`/payments/${gateway}/${orderId}/session`, {}, { headers })).data,
  });
}

// Payhere requires an auto-submitting HTML form POST (not a simple redirect
// link) — the API returns the target URL plus the exact fields/hash to submit.
export function useCreatePayhereSession() {
  const headers = useGatewayHeaders();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (await api.post<{ actionUrl: string; fields: Record<string, string> }>(`/payments/payhere/${orderId}/session`, {}, { headers }))
        .data,
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
