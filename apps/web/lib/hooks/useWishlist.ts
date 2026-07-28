"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@ecommercemultivendor/types";

interface WishlistItem {
  id: string;
  productId: Product;
}

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => (await api.get<{ items: WishlistItem[] }>("/me/wishlist")).data.items,
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => api.post("/me/wishlist", { productId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => api.delete(`/me/wishlist/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}
