"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";
import type { PaymentMethod } from "@ecommercemultivendor/types";

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
  // Shared with the API so the two lists cannot drift — a method the server
  // accepts but the client does not know about is how gateways get skipped.
  paymentMethod: PaymentMethod;
  couponCode?: string;
  /** Per-seller home-delivery vs pickup choice, keyed by seller id. */
  deliveryChoices?: Record<string, { method: "home_delivery" | "pickup_point"; pickupPointId?: string }>;
  clubPoints?: number;
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

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
}

export function usePickupPoints() {
  return useQuery({
    queryKey: ["pickup-points"],
    queryFn: async () => (await api.get<{ items: PickupPoint[] }>("/pickup-points")).data.items,
  });
}

/** The signed-in shopper's redeemable club-point balance and conversion rate. */
export function useClubPointBalance(enabled: boolean) {
  return useQuery({
    queryKey: ["club-points", "me"],
    queryFn: async () =>
      (await api.get<{ points: number; convertRate: number; minConvertPoints: number }>("/addons/club-points/me")).data,
    enabled,
    // A failure here just means the add-on is off; the checkout must still work.
    retry: false,
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
