"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PosVariant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  reserved: number;
}

export interface PosProduct {
  id: string;
  name: string;
  slug: string;
  barcode?: string | null;
  currency: string;
  images: string[];
  sellerId: string | null;
  variants: PosVariant[];
  pricing?: { variants: { sku: string; price: number }[] };
}

export interface PosCustomer { id: string; name: string; email: string; phone?: string }

export function usePosCustomers(q: string) {
  return useQuery({ queryKey: ["pos", "customers", q],
    queryFn: async () => (await api.get<{ items: PosCustomer[] }>("/addons/pos/customers", { params: { q } })).data.items,
    enabled: q.trim().length >= 3 });
}

export interface PosQuote {
  subtotal: number; discount: number; tax: number; shippingCost: number; grandTotal: number; currency: string;
  items: { productId: string; variantSku: string; unitPrice: number; quantity: number }[];
}

export function usePosQuote(input: { items: PosSaleInput["items"]; discount: number; shippingCost: number }) {
  return useQuery({ queryKey: ["pos", "quote", input],
    queryFn: async () => (await api.post<PosQuote>("/addons/pos/quote", input)).data,
    enabled: input.items.length > 0, staleTime: 0, retry: false });
}

/**
 * Counter search by name, SKU or scanned barcode. Idle until at least two
 * characters are typed, so opening the till does not fetch the whole catalog.
 */
export function usePosProductSearch(query: string) {
  return useQuery({
    queryKey: ["pos", "products", query],
    queryFn: async () => (await api.get<{ items: PosProduct[] }>("/addons/pos/products", { params: { q: query } })).data.items,
    enabled: query.trim().length >= 2,
  });
}

export interface PosSaleInput {
  idempotencyKey: string;
  items: { productId: string; variantSku: string; quantity: number }[];
  sellerId?: string | null;
  customerId?: string | null;
  walkIn?: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null;
  discount: number;
  shippingCost: number;
  paymentType: "cash" | "card" | "wallet" | "manual";
}

export interface PosSaleResult {
  id: string;
  code: string;
  grandTotal: number;
  currency: string;
}

export function useCreatePosSale() {
  return useMutation({
    mutationFn: async (input: PosSaleInput) => (await api.post<PosSaleResult>("/addons/pos/sales", input)).data,
  });
}

/** Opens the receipt PDF for a completed sale in a new tab. */
export async function openPosReceipt(orderId: string) {
  const response = await api.get(`/addons/pos/sales/${orderId}/receipt`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  window.open(url, "_blank");
  // Revoked on a delay so the new tab has time to load it first.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
