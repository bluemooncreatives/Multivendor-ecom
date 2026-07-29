"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";

export interface InlineAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface CheckoutInput {
  address: InlineAddress;
  paymentMethod:
    | "stripe"
    | "razorpay"
    | "paypal"
    | "cod"
    | "wallet"
    | "manual"
    | "sslcommerz"
    | "instamojo"
    | "paystack"
    | "voguepay"
    | "payhere"
    | "ngenius";
  couponCode?: string;
  idempotencyKey: string;
}

export interface OrderResponse {
  id: string;
  code: string;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

export function useCheckout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestId = useGuestStore((s) => s.guestId);
  const headers = accessToken ? {} : { "X-Guest-Id": guestId };

  return useMutation({
    mutationFn: async (input: CheckoutInput) => (await api.post<OrderResponse>("/orders/checkout", input, { headers })).data,
  });
}

export function useValidateCoupon() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestId = useGuestStore((s) => s.guestId);
  const headers = accessToken ? {} : { "X-Guest-Id": guestId };

  return useMutation({
    mutationFn: async (input: { code: string; orderSubtotal: number }) =>
      (await api.post<{ code: string; discount: number }>("/coupons/validate", input, { headers })).data,
  });
}
