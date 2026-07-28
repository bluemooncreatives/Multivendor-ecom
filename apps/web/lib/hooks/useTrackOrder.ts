"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OrderSummary } from "@/lib/hooks/useOrders";

export function useTrackOrder() {
  return useMutation({
    mutationFn: async (input: { code: string; phone: string }) => (await api.post<OrderSummary>("/orders/track", input)).data,
  });
}
