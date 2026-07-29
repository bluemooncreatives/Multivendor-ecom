"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@ecommercemultivendor/types";

export interface SellerProductInput {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  images: string[];
  basePrice: number;
  variants: { sku: string; attributes: Record<string, string>; price: number; stock: number }[];
  tags: string[];
  isDigital?: boolean;
  digitalFileUrl?: string;
}

export function useSellerProducts() {
  return useQuery({
    queryKey: ["seller", "products"],
    queryFn: async () => (await api.get<{ items: Product[] }>("/catalog/seller/products")).data.items,
  });
}

export function useCreateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SellerProductInput) => (await api.post("/catalog/seller/products", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useCloneSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/catalog/seller/products/${id}/clone`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export interface BulkImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

export function useBulkImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return (
        await api.post<BulkImportResult>("/catalog/seller/products/bulk-import", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useDeleteSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/catalog/seller/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export interface Shop {
  id?: string;
  sellerId?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  verified?: boolean;
}

export function useMyShop() {
  return useQuery({
    queryKey: ["seller", "shop"],
    queryFn: async () => {
      try {
        return (await api.get<Shop>("/seller/shop")).data;
      } catch {
        return null;
      }
    },
  });
}

export function usePublicShop(slug: string) {
  return useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => (await api.get<Shop>(`/seller/shops/${slug}`)).data,
    enabled: !!slug,
  });
}

export function useShopBySellerId(sellerId?: string) {
  return useQuery({
    queryKey: ["shop", "by-seller", sellerId],
    queryFn: async () => {
      try {
        return (await api.get<Shop>(`/seller/shops/by-seller/${sellerId}`)).data;
      } catch {
        return null;
      }
    },
    enabled: !!sellerId,
  });
}

export function useSaveShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Shop) => (await api.put<Shop>("/seller/shop", input)).data,
    onSuccess: (shop) => queryClient.setQueryData(["seller", "shop"], shop),
  });
}

export function useSellerOrders() {
  return useQuery({
    queryKey: ["seller", "orders"],
    queryFn: async () => (await api.get("/orders/seller")).data.items,
  });
}

export function useUpdateFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: string; status: string }) =>
      (await api.patch(`/seller/orders/${input.orderId}/fulfillment`, { status: input.status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "orders"] }),
  });
}

export function useSellerLedgerSummary() {
  return useQuery({
    queryKey: ["seller", "ledger", "summary"],
    queryFn: async () => (await api.get("/seller/ledger/summary")).data,
  });
}

export function useSellerLedger() {
  return useQuery({
    queryKey: ["seller", "ledger"],
    queryFn: async () => (await api.get("/seller/ledger")).data.items,
  });
}

export function useSellerWithdrawals() {
  return useQuery({
    queryKey: ["seller", "withdrawals"],
    queryFn: async () => (await api.get("/seller/withdrawals")).data.items,
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; method: string }) => (await api.post("/seller/withdrawals", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "withdrawals"] }),
  });
}

export function useCreatePosSale() {
  return useMutation({
    mutationFn: async (items: { productId: string; variantSku: string; quantity: number }[]) =>
      (await api.post("/addons/pos/sales", { items })).data,
  });
}
