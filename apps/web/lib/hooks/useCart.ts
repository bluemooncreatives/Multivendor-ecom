"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";

export interface CartLineDetail {
  productId: string;
  productSlug?: string;
  productName?: string;
  productImage?: string;
  currency: string;
  /** "__admin__" for In-House items; the checkout delivery step groups by this. */
  sellerId: string;
  sellerName: string;
  variantSku: string;
  variantAttributes: Record<string, string>;
  quantity: number;
  /** Pre-discount price, shown struck through when it differs from unitPrice. */
  listPrice: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
}

export interface CartDetails {
  id?: string;
  items: CartLineDetail[];
  subtotal?: number;
}

function useCartHeaders() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const guestId = useGuestStore((s) => s.guestId);
  return accessToken ? {} : { "X-Guest-Id": guestId };
}

export function useCart() {
  const headers = useCartHeaders();
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get<CartDetails>("/cart", { headers })).data,
  });
}

export function useSetCartItem() {
  const headers = useCartHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { productId: string; variantSku: string; quantity: number }) =>
      (await api.put<CartDetails>("/cart/items", input, { headers })).data,
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart),
  });
}

export function useRemoveCartItem() {
  const headers = useCartHeaders();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { productId: string; variantSku: string }) =>
      api.delete(`/cart/items/${input.productId}/${input.variantSku}`, { headers }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
}
