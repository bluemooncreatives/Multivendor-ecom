"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OrderSummary {
  id: string;
  code: string;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  details: {
    sellerId: string;
    status: string;
    items: { name: string; quantity: number; unitPrice: number }[];
  }[];
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get<{ items: OrderSummary[] }>("/orders/mine")).data.items,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => (await api.post(`/orders/${orderId}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
