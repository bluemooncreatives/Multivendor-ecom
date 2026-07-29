"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data,
  });
}

export function useAdminUsers(role?: string) {
  return useQuery({
    queryKey: ["admin", "users", role],
    queryFn: async () => (await api.get("/admin/users", { params: { role } })).data.items,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; banned: boolean }) =>
      (await api.patch(`/admin/users/${input.id}/ban`, { banned: input.banned })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useVerifySeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) =>
      (await api.patch(`/admin/sellers/${input.id}/verify`, { approve: input.approve })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  /** Matches the order code or the buyer's phone. */
  q?: string;
  from?: string;
  to?: string;
  page?: number;
}

export interface AdminOrderPage {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrder {
  id: string;
  code: string;
  grandTotal: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  couponCode: string | null;
  discount: number;
  tax: number;
  shippingTotal: number;
  addressSnapshot: Record<string, string>;
  details: {
    sellerId: string | null;
    status: string;
    subtotal: number;
    shippingCost: number;
    commissionAmount: number;
    pickupPointId: string | null;
    items: { name: string; quantity: number; unitPrice: number }[];
  }[];
}

export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: async () => (await api.get<AdminOrderPage>("/admin/orders", { params: filters })).data,
  });
}

export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () => (await api.get("/admin/withdrawals")).data.items,
  });
}

export function useResolveWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) =>
      (await api.patch(`/admin/withdrawals/${input.id}`, { approve: input.approve })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] }),
  });
}

export function useAdminAddons() {
  return useQuery({
    queryKey: ["admin", "addons"],
    queryFn: async () => (await api.get("/admin/addons")).data.items,
  });
}

export function useToggleAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; enabled: boolean }) =>
      (await api.patch(`/admin/addons/${input.key}`, { enabled: input.enabled })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "addons"] }),
  });
}

export function useGeneralSettings() {
  return useQuery({
    queryKey: ["admin", "settings", "general"],
    queryFn: async () => (await api.get("/admin/settings/general")).data,
  });
}

export function useSaveGeneralSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => (await api.put("/admin/settings/general", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings", "general"] }),
  });
}

export function usePendingProducts() {
  return useQuery({
    queryKey: ["admin", "products", "pending"],
    queryFn: async () => (await api.get("/catalog/admin/products/pending")).data.items,
  });
}

export function useAdminWalletRecharges() {
  return useQuery({
    queryKey: ["admin", "wallet-recharges"],
    queryFn: async () => (await api.get("/admin/wallet-recharges")).data.items,
  });
}

export function useResolveWalletRecharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) =>
      (await api.patch(`/admin/wallet-recharges/${input.id}`, { approve: input.approve })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "wallet-recharges"] }),
  });
}

export function useModerateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approved: boolean }) =>
      (await api.post(`/catalog/admin/products/${input.id}/moderate`, { approved: input.approved })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products", "pending"] }),
  });
}
