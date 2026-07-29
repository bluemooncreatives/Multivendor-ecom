"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Flash deals ---------------------------------------------------------------

export interface FlashDealProduct {
  productId: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    currency: string;
    basePrice: number;
  } | null;
  variantSku: string;
  discountPercent: number;
  dealStock: number;
}

export interface FlashDeal {
  id: string;
  title: string;
  slug: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt: string;
  products: FlashDealProduct[];
}

export function useActiveFlashDeals() {
  return useQuery({
    queryKey: ["flash-deals"],
    queryFn: async () => (await api.get<{ items: FlashDeal[] }>("/flash-deals")).data.items,
  });
}

export function useFlashDeal(slug: string) {
  return useQuery({
    queryKey: ["flash-deal", slug],
    queryFn: async () => (await api.get<FlashDeal>(`/flash-deals/slug/${slug}`)).data,
    enabled: Boolean(slug),
    retry: false,
  });
}

// --- Classifieds (customer-to-customer listings) --------------------------------

export interface Classified {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency?: string;
  condition: "new" | "used";
  categoryId: string | { id: string; name: string };
  images: string[];
  location: string;
  contactPhone: string;
  status: string;
  createdAt: string;
}

export interface ClassifiedFilters {
  q?: string;
  categoryId?: string;
  location?: string;
  page?: number;
}

export function useClassifieds(filters: ClassifiedFilters = {}) {
  return useQuery({
    queryKey: ["classifieds", filters],
    queryFn: async () =>
      (await api.get<{ items: Classified[]; total: number; page: number; pageSize: number }>("/addons/classifieds", {
        params: filters,
      })).data,
  });
}

export function useClassified(slug: string) {
  return useQuery({
    queryKey: ["classified", slug],
    queryFn: async () => (await api.get<Classified>(`/addons/classifieds/slug/${slug}`)).data,
    enabled: Boolean(slug),
    retry: false,
  });
}

// --- Customer packages ------------------------------------------------------------

export interface CustomerPackage {
  id: string;
  name: string;
  price: number;
  currency?: string;
  /** How many classified listings the package grants. */
  productUploadLimit: number;
  durationDays: number;
  active: boolean;
}

export function useCustomerPackages() {
  return useQuery({
    queryKey: ["customer-packages"],
    queryFn: async () => (await api.get<{ items: CustomerPackage[] }>("/addons/packages/customer")).data.items,
  });
}

export function usePurchaseCustomerPackage() {
  return useMutation({
    mutationFn: async (input: { packageId: string; paymentMethod: string }) =>
      (await api.post("/addons/packages/customer/purchase", input)).data,
  });
}

// --- Newsletter --------------------------------------------------------------------

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (email: string) => (await api.post("/newsletter/subscribe", { email })).data,
  });
}
