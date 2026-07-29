"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Affiliate program (admin) ------------------------------------------------

export interface AffiliateConfig {
  id: string;
  enabled: boolean;
  commissionPercent: number;
  cookieDays: number;
  minWithdrawAmount: number;
  actionBonuses: Record<string, number>;
  allowedMethods: string[];
}

export interface AffiliateUserRow {
  id: string;
  referralCode: string;
  status: "pending" | "approved" | "suspended";
  totalEarnings: number;
  availableBalance: number;
  userId: { id: string; name: string; email: string; phone?: string } | null;
}

export function useAffiliateAdminConfig() {
  return useQuery({
    queryKey: ["admin", "affiliate", "config"],
    queryFn: async () => (await api.get<AffiliateConfig>("/addons/affiliate/config")).data,
  });
}

export function useSaveAffiliateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<AffiliateConfig, "id">) => (await api.put("/addons/admin/affiliate/config", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliate"] }),
  });
}

export function useAffiliateUsers(status?: string) {
  return useQuery({
    queryKey: ["admin", "affiliate", "users", status],
    queryFn: async () =>
      (await api.get<{ items: AffiliateUserRow[] }>("/addons/admin/affiliate/users", { params: { status } })).data.items,
  });
}

export function useAffiliateUserDetail(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["admin", "affiliate", "users", id],
    queryFn: async () => (await api.get(`/addons/admin/affiliate/users/${id}`)).data,
  });
}

export function useModerateAffiliateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string; rejectionReason?: string }) =>
      (await api.patch(`/addons/admin/affiliate/users/${input.id}`, { status: input.status, rejectionReason: input.rejectionReason }))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliate"] }),
  });
}

export function useAffiliateWithdrawals(status?: string) {
  return useQuery({
    queryKey: ["admin", "affiliate", "withdrawals", status],
    queryFn: async () => (await api.get("/addons/admin/affiliate/withdrawals", { params: { status } })).data.items,
  });
}

export function useResolveAffiliateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean; note?: string }) =>
      (await api.post(`/addons/admin/affiliate/withdrawals/${input.id}/resolve`, { approve: input.approve, note: input.note })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliate"] }),
  });
}

export function useAffiliatePayments() {
  return useQuery({
    queryKey: ["admin", "affiliate", "payments"],
    queryFn: async () => (await api.get("/addons/admin/affiliate/payments")).data.items,
  });
}

export function useReferredUsers() {
  return useQuery({
    queryKey: ["admin", "affiliate", "referrals"],
    queryFn: async () => (await api.get("/addons/admin/affiliate/referrals")).data.items,
  });
}

// --- Club points (admin) --------------------------------------------------------

export interface ClubPointConfig {
  id: string;
  convertRate: number;
  minConvertPoints: number;
}

export function useClubPointConfig() {
  return useQuery({
    queryKey: ["admin", "club-points", "config"],
    queryFn: async () => (await api.get<ClubPointConfig>("/addons/admin/club-points/config")).data,
  });
}

export function useSaveClubPointConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { convertRate: number; minConvertPoints: number }) =>
      (await api.put("/addons/admin/club-points/config", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "club-points"] }),
  });
}

export interface ClubPointProduct {
  id: string;
  name: string;
  slug: string;
  clubPoints: number;
  basePrice: number;
}

export function useClubPointProducts(assignedOnly = false) {
  return useQuery({
    queryKey: ["admin", "club-points", "products", assignedOnly],
    queryFn: async () =>
      (await api.get<{ items: ClubPointProduct[] }>("/addons/admin/club-points/products", { params: { assignedOnly } })).data.items,
  });
}

export function useSetProductClubPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; clubPoints: number }) =>
      (await api.patch(`/addons/admin/club-points/products/${input.id}`, { clubPoints: input.clubPoints })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "club-points", "products"] }),
  });
}

export function useBulkSetClubPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { clubPoints: number; categoryId?: string; sellerId?: string }) =>
      (await api.post("/addons/admin/club-points/products/bulk", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "club-points", "products"] }),
  });
}

export function useClubPointUsers() {
  return useQuery({
    queryKey: ["admin", "club-points", "users"],
    queryFn: async () =>
      (await api.get<{ items: { id: string; name: string; email: string; clubPoints: number }[] }>("/addons/admin/club-points/users"))
        .data.items,
  });
}

// --- Refunds (admin) ------------------------------------------------------------

export interface RefundRow {
  id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  images: string[];
  createdAt: string;
  userId: { id: string; name: string; email: string } | null;
  sellerId: { id: string; name: string; email: string } | null;
}

export function useAdminRefunds(status?: string) {
  return useQuery({
    queryKey: ["admin", "refunds", status],
    queryFn: async () => (await api.get<{ items: RefundRow[] }>("/addons/admin/refunds", { params: { status } })).data.items,
  });
}

export function usePaidRefunds() {
  return useQuery({
    queryKey: ["admin", "refunds", "paid"],
    queryFn: async () => (await api.get<{ items: RefundRow[] }>("/addons/admin/refunds/paid")).data.items,
  });
}

export function useResolveRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean; resolutionNote?: string }) =>
      (await api.post(`/addons/refunds/${input.id}/resolve`, { approve: input.approve, resolutionNote: input.resolutionNote })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] }),
  });
}

export interface RefundConfig {
  id: string;
  requestWindowDays: number;
  showSticker: boolean;
  stickerUrl?: string;
}

export function useRefundConfig() {
  return useQuery({
    queryKey: ["admin", "refunds", "config"],
    queryFn: async () => (await api.get<RefundConfig>("/addons/admin/refunds/config")).data,
  });
}

export function useSaveRefundConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { requestWindowDays: number; showSticker: boolean; stickerUrl?: string }) =>
      (await api.put("/addons/admin/refunds/config", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "refunds", "config"] }),
  });
}

// --- Packages (admin) -----------------------------------------------------------

export interface SellerPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  productLimit: number;
  commissionRateOverride: number | null;
  active: boolean;
}

export interface CustomerPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  classifiedListingLimit: number;
  active: boolean;
}

export function useAdminSellerPackages() {
  return useQuery({
    queryKey: ["admin", "packages", "seller"],
    queryFn: async () => (await api.get<{ items: SellerPackage[] }>("/addons/admin/packages/seller")).data.items,
  });
}

export function useSaveSellerPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<SellerPackage> & { id?: string }) =>
      id
        ? (await api.patch(`/addons/admin/packages/seller/${id}`, input)).data
        : (await api.post("/addons/admin/packages/seller", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "packages", "seller"] }),
  });
}

export function useDeleteSellerPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/addons/admin/packages/seller/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "packages", "seller"] }),
  });
}

export function useAdminCustomerPackages() {
  return useQuery({
    queryKey: ["admin", "packages", "customer"],
    queryFn: async () => (await api.get<{ items: CustomerPackage[] }>("/addons/admin/packages/customer")).data.items,
  });
}

export function useSaveCustomerPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CustomerPackage> & { id?: string }) =>
      id
        ? (await api.patch(`/addons/admin/packages/customer/${id}`, input)).data
        : (await api.post("/addons/admin/packages/customer", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "packages", "customer"] }),
  });
}

export function useDeleteCustomerPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/addons/admin/packages/customer/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "packages", "customer"] }),
  });
}

export function usePackagePayments(kind: "seller" | "customer", status?: string) {
  return useQuery({
    queryKey: ["admin", "packages", kind, "payments", status],
    queryFn: async () => (await api.get(`/addons/admin/packages/${kind}/payments`, { params: { status } })).data.items,
  });
}

export function useApprovePackagePayment(kind: "seller" | "customer") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) =>
      (await api.post(`/addons/admin/packages/${kind}/payments/${input.id}/approve`, { approve: input.approve })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "packages", kind, "payments"] }),
  });
}

export function useEnforceProductLimits() {
  return useMutation({
    mutationFn: async () => (await api.post("/addons/admin/packages/enforce-limits")).data,
  });
}
