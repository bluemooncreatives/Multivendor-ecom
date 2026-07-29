"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * What the API returns in place of a secret. The real value is never sent to the
 * browser — `hint` is the last four characters, just enough to tell two keys
 * apart when confirming which credentials are live.
 */
export interface SecretStatus {
  configured: boolean;
  hint: string | null;
}

/** Sentinel that clears a stored secret; omitting a field leaves it untouched. */
export const CLEAR_SECRET = "__clear__";

export type SettingsGroup = "smtp" | "storage" | "socialLogin" | "recaptcha";

export function useSettingsGroup(group: SettingsGroup) {
  return useQuery({
    queryKey: ["admin", "settings", group],
    queryFn: async () => (await api.get<Record<string, unknown>>(`/admin/settings/groups/${group}`)).data,
  });
}

export function useSaveSettingsGroup(group: SettingsGroup) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      (await api.put(`/admin/settings/groups/${group}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings", group] }),
  });
}

// --- Business settings (activation toggles, tax, commission, shipping) --------

export interface ActivationSettings {
  vendorSystem: boolean;
  conversation: boolean;
  couponSystem: boolean;
  walletSystem: boolean;
  pickupPoint: boolean;
  guestCheckout: boolean;
  classifiedProduct: boolean;
  maintenanceMode: boolean;
  forceHttps: boolean;
  emailVerification: boolean;
  categoryBasedCommission: boolean;
  cashOnDelivery: boolean;
  reviewSystem: boolean;
}

export interface BusinessSettings {
  taxPercent: number;
  commissionPercent: number;
  shippingMode: "flat" | "product_wise" | "seller_wise" | "free";
  flatShippingCost: number;
  adminShippingCost: number;
  minOrderForFreeShipping: number | null;
  activation: ActivationSettings;
  demoMode: boolean;
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["admin", "settings", "business"],
    queryFn: async () => (await api.get<BusinessSettings>("/admin/settings/business")).data,
  });
}

export function useSaveBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<BusinessSettings>) => (await api.put("/admin/settings/business", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings", "business"] }),
  });
}

// --- SEO ----------------------------------------------------------------------

export interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  metaImageUrl?: string;
  author?: string;
  revisitAfterDays: number;
  sitemapUrl?: string;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId?: string;
  facebookPixelEnabled: boolean;
  facebookPixelId?: string;
  facebookChatEnabled: boolean;
  facebookPageId?: string;
}

export function useSeoSettings() {
  return useQuery({
    queryKey: ["admin", "settings", "seo"],
    queryFn: async () => (await api.get<SeoSettings>("/admin/settings/seo")).data,
  });
}

export function useSaveSeoSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SeoSettings>) => (await api.put("/admin/settings/seo", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings", "seo"] }),
  });
}

// --- Seller verification form builder -----------------------------------------

export interface VerificationField {
  id: string;
  label: string;
  type: "text" | "select" | "multi_select" | "radio" | "file";
  options: string[];
  required: boolean;
  order: number;
  active: boolean;
}

export function useVerificationFields() {
  return useQuery({
    queryKey: ["admin", "verification-fields"],
    queryFn: async () => (await api.get<{ items: VerificationField[] }>("/admin/settings/verification-fields")).data.items,
  });
}

export function useSaveVerificationField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<VerificationField> & { id?: string }) =>
      id
        ? (await api.patch(`/admin/settings/verification-fields/${id}`, input)).data
        : (await api.post("/admin/settings/verification-fields", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "verification-fields"] }),
  });
}

export function useDeleteVerificationField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/settings/verification-fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "verification-fields"] }),
  });
}

// --- Translation editor --------------------------------------------------------

export interface TranslationRow {
  id: string;
  languageCode: string;
  key: string;
  value: string;
}

export function useTranslations(code: string, q: string) {
  return useQuery({
    queryKey: ["admin", "translations", code, q],
    queryFn: async () =>
      (await api.get<{ items: TranslationRow[] }>("/localization/admin/translations", { params: { code, q: q || undefined } }))
        .data.items,
    enabled: Boolean(code),
  });
}

export function useSaveTranslations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { languageCode: string; entries: { key: string; value: string }[] }) =>
      (await api.put("/localization/admin/translations", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "translations"] }),
  });
}

export function useCopyTranslations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fromCode: string; toCode: string }) =>
      (await api.post("/localization/admin/translations/copy", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "translations"] }),
  });
}
