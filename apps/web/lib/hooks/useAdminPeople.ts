"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Sellers -------------------------------------------------------------------

export interface SellerRow {
  seller: { id: string; name: string; email: string; phone?: string; banned: boolean; createdAt: string };
  shop: { id: string; name: string; slug: string; verified: boolean; verificationStatus: string } | null;
}

export function useAdminSellers(params: { verificationStatus?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "sellers", params],
    queryFn: async () => (await api.get<{ items: SellerRow[] }>("/admin/sellers", { params })).data.items,
  });
}

export function useSellerDetail(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["admin", "sellers", id],
    queryFn: async () => (await api.get(`/admin/sellers/${id}`)).data,
  });
}

export function useSellerPaymentHistory(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["admin", "sellers", id, "payments"],
    queryFn: async () => (await api.get(`/admin/sellers/${id}/payments`)).data,
  });
}

export function usePayToSeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sellerId: string;
      amount: number;
      method: string;
      reference?: string;
      note?: string;
    }) => {
      const { sellerId, ...body } = input;
      // Generated per submission so a double-click settles once, not twice.
      return (await api.post(`/admin/sellers/${sellerId}/payouts`, { ...body, idempotencyKey: crypto.randomUUID() })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] }),
  });
}

export function useSellerPayouts() {
  return useQuery({
    queryKey: ["admin", "sellers", "payouts"],
    queryFn: async () => (await api.get("/admin/sellers/payouts")).data.items,
  });
}

export function usePendingShopVerifications() {
  return useQuery({
    queryKey: ["admin", "sellers", "verifications"],
    queryFn: async () => (await api.get("/admin/sellers/verifications")).data.items,
  });
}

export function useVerifySeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sellerId: string; approve: boolean }) =>
      (await api.patch(`/admin/sellers/${input.sellerId}/verify`, { approve: input.approve })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] }),
  });
}

// --- Staff & roles ---------------------------------------------------------------

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  banned: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
  permissions: string[];
}

export interface PermissionItem {
  id: string;
  key: string;
  label: string;
  group: string;
}

export function usePermissions() {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: async () => (await api.get<{ items: PermissionItem[] }>("/admin/permissions")).data.items,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => (await api.get<{ items: RoleItem[] }>("/admin/roles")).data.items,
  });
}

export function useSaveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id?: string; name: string; permissions: string[] }) =>
      id ? (await api.patch(`/admin/roles/${id}`, input)).data : (await api.post("/admin/roles", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => (await api.get<{ items: StaffMember[] }>("/admin/staff")).data.items,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string; permissions: string[] }) =>
      (await api.post("/admin/staff", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; permissions?: string[]; password?: string }) =>
      (await api.patch(`/admin/staff/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
}

// --- Customer bulk import ----------------------------------------------------------

export interface ImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

export function useImportCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return (await api.post<ImportResult>("/admin/users/import", form)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// --- SMS / OTP ---------------------------------------------------------------------

export interface OtpSettings {
  id: string;
  provider: "twilio" | "nexmo" | "msg91" | "ssl_wireless" | "none";
  otpOnRegistration: boolean;
  otpOnForgotPassword: boolean;
  otpOnOrderPlacement: boolean;
  senderId?: string;
}

export function useOtpSettings() {
  return useQuery({
    queryKey: ["admin", "otp"],
    queryFn: async () => (await api.get<OtpSettings>("/admin/settings/otp")).data,
  });
}

export function useSaveOtpSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<OtpSettings, "id">) => (await api.put("/admin/settings/otp", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "otp"] }),
  });
}

export function useSaveOtpCredentials() {
  return useMutation({
    mutationFn: async (input: Record<string, string>) => (await api.put("/admin/settings/otp/credentials", input)).data,
  });
}

export function useSendBulkSms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { message: string; audience: "all" | "customers" | "sellers" }) =>
      (await api.post("/admin/sms/send", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sms", "logs"] }),
  });
}

export function useSmsLogs() {
  return useQuery({
    queryKey: ["admin", "sms", "logs"],
    queryFn: async () => (await api.get("/admin/sms/logs")).data.items,
  });
}

// --- Search report -------------------------------------------------------------------

export interface SearchTerm {
  query: string;
  count: number;
  avgResults: number;
  lastSearchedAt: string;
}

export function useSearchReport(zeroResults = false) {
  return useQuery({
    queryKey: ["admin", "reports", "searches", zeroResults],
    queryFn: async () =>
      (await api.get<{ items: SearchTerm[] }>("/admin/reports/searches", { params: { zeroResults } })).data.items,
  });
}
