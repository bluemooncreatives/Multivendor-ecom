"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Review {
  id: string;
  userId: { id: string; name: string; avatarUrl?: string } | string;
  productId: { id: string; name: string } | string;
  orderId: string;
  rating: number;
  comment?: string;
  images: string[];
  approved: boolean;
  sellerReply?: string;
  createdAt: string;
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => (await api.get<{ items: Review[] }>(`/reviews/product/${productId}`)).data.items,
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { productId: string; orderId: string; rating: number; comment?: string }) =>
      (await api.post<Review>("/reviews", input)).data,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", variables.productId] }),
  });
}

export function useSellerReviews() {
  return useQuery({
    queryKey: ["reviews", "seller"],
    queryFn: async () => (await api.get<{ items: Review[] }>("/reviews/seller")).data.items,
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; sellerReply: string }) =>
      (await api.post<Review>(`/reviews/${input.id}/reply`, { sellerReply: input.sellerReply })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews", "seller"] }),
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["reviews", "admin"],
    queryFn: async () => (await api.get<{ items: Review[] }>("/reviews/admin")).data.items,
  });
}

export function useModerateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approved: boolean }) =>
      (await api.post<Review>(`/reviews/admin/${input.id}/moderate`, { approved: input.approved })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews", "admin"] }),
  });
}
