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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; method: string }) =>
      (await api.post("/addons/affiliate/withdrawals", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate"] }),
  });
}

export function useMyAffiliateWithdrawals() {
  return useQuery({
    queryKey: ["affiliate", "withdrawals"],
    queryFn: async () => (await api.get("/addons/affiliate/withdrawals")).data.items,
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: ["affiliate", "referrals"],
    queryFn: async () => (await api.get("/addons/affiliate/referrals")).data.items,
  });
}

export function useAffiliatePaymentSettings() {
  return useQuery({
    queryKey: ["affiliate", "payment-settings"],
    queryFn: async () => (await api.get("/addons/affiliate/payment-settings")).data,
  });
}

export function useSaveAffiliatePaymentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, string>) => (await api.put("/addons/affiliate/payment-settings", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliate", "payment-settings"] }),
  });
}

// --- Club points -----------------------------------------------------------------

export interface ClubPointsSummary {
  points: number;
  convertRate: number;
  minConvertPoints: number;
  convertibleValue: number;
}

export function useMyClubPoints() {
  return useQuery({
    queryKey: ["club-points", "me"],
    queryFn: async () => (await api.get<ClubPointsSummary>("/addons/club-points/me")).data,
  });
}

export function useClubPointsHistory() {
  return useQuery({
    queryKey: ["club-points", "history"],
    queryFn: async () => (await api.get("/addons/club-points/history")).data.items,
  });
}

export function useConvertClubPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (points: number) => (await api.post("/addons/club-points/convert", { points })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-points"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

// --- Packages (member-facing) --------------------------------------------------------

export function useSellerPackages() {
  return useQuery({
    queryKey: ["packages", "seller"],
    queryFn: async () => (await api.get("/addons/packages/seller")).data.items,
  });
}

export function useCustomerPackages() {
  return useQuery({
    queryKey: ["packages", "customer"],
    queryFn: async () => (await api.get("/addons/packages/customer")).data.items,
  });
}

export function useMySellerSubscription() {
  return useQuery({
    queryKey: ["packages", "seller", "mine"],
    queryFn: async () => (await api.get("/addons/packages/seller/mine")).data,
  });
}

export function useMyCustomerSubscription() {
  return useQuery({
    queryKey: ["packages", "customer", "mine"],
    queryFn: async () => (await api.get("/addons/packages/customer/mine")).data,
  });
}

export function usePurchasePackage(kind: "seller" | "customer") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { packageId: string; paymentMethod: "wallet" | "manual" }) =>
      (await api.post(`/addons/packages/${kind}/purchase`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages", kind] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

// --- Refunds -----------------------------------------------------------------

export function useMyRefundRequests() {
  return useQuery({
    queryKey: ["refunds", "mine"],
    queryFn: async () => (await api.get("/addons/refunds/mine")).data.items,
  });
}

// The refundable amount is computed server-side from the order, so it is
// deliberately not part of the request body.
export function useCreateRefundRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { orderId: string; sellerId: string; reason: string; images?: string[] }) =>
      (await api.post("/addons/refunds", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}

export interface RefundEligibility {
  showSticker: boolean;
  stickerUrl?: string;
  shipments: {
    sellerId: string;
    amount: number;
    eligible: boolean;
    windowClosesAt: string | null;
    alreadyRequested: boolean;
  }[];
}

export function useRefundEligibility(orderId: string | null) {
  return useQuery({
    enabled: Boolean(orderId),
    queryKey: ["refunds", "eligibility", orderId],
    queryFn: async () => (await api.get<RefundEligibility>(`/addons/refunds/eligibility/${orderId}`)).data,
  });
}

export function useSellerRefundRequests() {
  return useQuery({
    queryKey: ["refunds", "seller"],
    queryFn: async () => (await api.get("/addons/refunds/seller")).data.items,
  });
}

export function useSellerDecideRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean; resolutionNote?: string }) =>
      (await api.post(`/addons/refunds/${input.id}/seller-decision`, {
        approve: input.approve,
        resolutionNote: input.resolutionNote,
      })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["refunds"] }),
  });
}
