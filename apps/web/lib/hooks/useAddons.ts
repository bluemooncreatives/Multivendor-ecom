"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Classifieds -------------------------------------------------------------

export interface ClassifiedInput {
  title: string;
  description?: string;
  price: number;
  categoryId: string;
  images?: string[];
  location?: string;
  contactPhone?: string;
}

export function useMyClassifieds() {
  return useQuery({
    queryKey: ["classifieds", "mine"],
    queryFn: async () => (await api.get("/addons/classifieds/mine")).data.items,
  });
}

export function useCreateClassified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassifiedInput) => (await api.post("/addons/classifieds", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classifieds"] }),
  });
}

export function useDeleteClassified() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/addons/classifieds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classifieds"] }),
  });
}

// --- Affiliate -----------------------------------------------------------------

export function useAffiliateConfig() {
  return useQuery({
    queryKey: ["affiliate", "config"],
    queryFn: async () => (await api.get("/addons/affiliate/config")).data,
  });
}

export function useMyAffiliate() {
  return useQuery({
    queryKey: ["affiliate", "me"],
    queryFn: async () => {
      try {
        return (await api.get("/addons/affiliate/me")).data;
      } catch {
        return null;
      }
    },
  });
}

export function useJoinAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/addons/affiliate/join")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate"] }),
  });
}

export function useAffiliateEarnings() {
  return useQuery({
    queryKey: ["affiliate", "earnings"],
    queryFn: async () => (await api.get("/addons/affiliate/earnings")).data.items,
  });
}

export function useRequestAffiliateWithdraw() {
  return useMutation({
    mutationFn: async (input: { amount: number; method: string }) =>
      (await api.post("/addons/affiliate/withdrawals", input)).data,
  });
}

// --- Club points -----------------------------------------------------------------

export function useMyClubPoints() {
  return useQuery({
    queryKey: ["club-points", "me"],
    queryFn: async () => (await api.get("/addons/club-points/me")).data,
  });
}

export function useClubPointsHistory() {
  return useQuery({
    queryKey: ["club-points", "history"],
    queryFn: async () => (await api.get("/addons/club-points/history")).data.items,
  });
}

// --- Refunds -----------------------------------------------------------------

export function useMyRefundRequests() {
  return useQuery({
    queryKey: ["refunds", "mine"],
    queryFn: async () => (await api.get("/addons/refunds/mine")).data.items,
  });
}

export function useCreateRefundRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: string; sellerId: string; reason: string; amount: number }) =>
      (await api.post("/addons/refunds", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}
