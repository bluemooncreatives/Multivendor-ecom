"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@ecommercemultivendor/types";

import type { ProductFormInput } from "./useCatalogForm";

/** @deprecated Use ProductFormInput — the form now sends the full legacy field set. */
export type SellerProductInput = ProductFormInput;

export function useSellerProducts() {
  return useQuery({
    queryKey: ["seller", "products"],
    queryFn: async () => (await api.get<{ items: Product[] }>("/catalog/seller/products")).data.items,
  });
}

// The seller list endpoint returns every field, so the edit page reads its
// product from that cache-shared list rather than needing a by-id endpoint.
export function useSellerProduct(id: string) {
  const { data, ...rest } = useSellerProducts();
  return { ...rest, data: data?.find((p) => p.id === id) };
}

export function useCreateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductFormInput) => (await api.post("/catalog/seller/products", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seller", "products"] }),
  });
}

export function useUpdateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ProductFormInput & { id: string }) =>
      (await api.patch(`/catalog/seller/products/${id}`, input)).data,
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
  verificationStatus?: "pending" | "approved" | "rejected";
  verificationDocs?: string[];
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

export interface VerificationFormField {
  id: string;
  label: string;
  type: "text" | "select" | "multi_select" | "radio" | "file";
  options: string[];
  required: boolean;
}

/** The field list an administrator composed, for the seller's form to render. */
export function useVerificationForm() {
  return useQuery({
    queryKey: ["seller", "verification-form"],
    queryFn: async () =>
      (await api.get<{ items: VerificationFormField[] }>("/seller/shop/verification-form")).data.items,
  });
}

export function useApplyForVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { verificationDocs: string[]; answers: Record<string, string | string[]> }) =>
      (await api.post<Shop>("/seller/shop/verification", input)).data,
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
