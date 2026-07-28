"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DigitalPurchase {
  orderId: string;
  orderCode: string;
  productId: string;
  name: string;
}

export function useMyDigitalPurchases() {
  return useQuery({
    queryKey: ["digital-products", "mine"],
    queryFn: async () => (await api.get<{ items: DigitalPurchase[] }>("/digital-products/mine")).data.items,
  });
}

export function useRequestDownload() {
  return useMutation({
    mutationFn: async (input: { productId: string; orderId: string }) =>
      (await api.post<{ downloadUrl: string }>("/digital-products/request-download", input)).data,
  });
}
