"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProductFormInput } from "./useCatalogForm";

// --- Coupons ---------------------------------------------------------------------

export interface Coupon {
  id: string;
  code: string;
  type: "flat" | "percent";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimitTotal: number | null;
  usageLimitPerUser: number;
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
}

export type CouponInput = Omit<Coupon, "id" | "active"> & { active?: boolean };

export function useCoupons() {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => (await api.get<{ items: Coupon[] }>("/coupons")).data.items,
  });
}

export function useSaveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CouponInput> & { id?: string }) =>
      id ? (await api.patch(`/coupons/${id}`, input)).data : (await api.post("/coupons", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useCouponUsage(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["admin", "coupons", id, "usage"],
    queryFn: async () => (await api.get(`/coupons/${id}/usage`)).data,
  });
}

// --- Taxonomy (categories & brands) ------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: 0 | 1 | 2;
  ancestors: string[];
  // Overrides the global commission when category-based commission is enabled.
  commissionRate: number | null;
  featured: boolean;
  active: boolean;
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  // Categories this brand is offered under; empty means every category.
  categoryIds: string[];
  featured: boolean;
  active: boolean;
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await api.get<{ items: Category[] }>("/catalog/admin/categories")).data.items,
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Category> & { id?: string }) =>
      id ? (await api.patch(`/catalog/categories/${id}`, input)).data : (await api.post("/catalog/categories", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useToggleCategoryFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; featured: boolean }) =>
      (await api.patch(`/catalog/categories/${input.id}/featured`, { featured: input.featured })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useAdminBrands() {
  return useQuery({
    queryKey: ["admin", "brands"],
    queryFn: async () => (await api.get<{ items: Brand[] }>("/catalog/admin/brands")).data.items,
  });
}

export function useSaveBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Brand> & { id?: string }) =>
      id ? (await api.patch(`/catalog/brands/${id}`, input)).data : (await api.post("/catalog/brands", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/catalog/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useToggleBrandFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; featured: boolean }) =>
      (await api.patch(`/catalog/brands/${input.id}/featured`, { featured: input.featured })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

// --- Admin product catalog -----------------------------------------------------------

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  published: boolean;
  featured: boolean;
  todaysDeal: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  // Null for admin-owned ("In House") listings, which have no vendor.
  sellerId: string | null;
  addedBy: "admin" | "seller";
  currency: string;
}

export function useAdminProducts(
  params: { q?: string; approvalStatus?: string; published?: boolean; sellerId?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: ["admin", "products", params],
    queryFn: async () =>
      (await api.get<{ items: AdminProduct[]; total: number; page: number }>("/catalog/admin/products", { params })).data,
  });
}

// In-House products: authored by staff, so they carry no seller, skip the
// moderation queue and are published on creation.
export function useCreateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductFormInput) => (await api.post("/catalog/admin/products", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

// Staff edit of any listing, including sellers' — the seller-scoped endpoint
// deliberately refuses to touch products the requester does not own.
export function useUpdateAdminProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ProductFormInput> & { id: string }) =>
      (await api.patch(`/catalog/admin/products/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProductFlags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...flags }: { id: string; featured?: boolean; todaysDeal?: boolean; published?: boolean }) =>
      (await api.patch(`/catalog/products/${id}/flags`, flags)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["seller", "products"] });
    },
  });
}

// Staff product import. Omitting sellerId creates admin-owned In-House rows.
export function useImportAdminProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, sellerId }: { file: File; sellerId?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      return (
        await api.post<{ created: number; skipped: { row: number; reason: string }[] }>(
          "/catalog/admin/products/bulk-import",
          formData,
          { params: sellerId ? { sellerId } : {}, headers: { "Content-Type": "multipart/form-data" } },
        )
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

/** Alias for readability when the payload is a PDF (invoices) rather than a CSV. */
export const downloadFile = downloadCsv;

// Streams the response straight to a download without routing it through React state.
export async function downloadCsv(path: string, filename: string) {
  const response = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useGenerateSkuCombinations() {
  return useMutation({
    mutationFn: async (input: { baseSku: string; basePrice: number; attributes: Record<string, string[]> }) =>
      (
        await api.post<{ variants: { sku: string; attributes: Record<string, string>; price: number; stock: number }[] }>(
          "/catalog/seller/products/sku-combinations",
          input,
        )
      ).data.variants,
  });
}

// --- Admin orders ---------------------------------------------------------------------

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) =>
      (await api.patch(`/admin/orders/${input.id}/status`, { status: input.status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useUpdateOrderPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; paymentStatus: string }) =>
      (await api.patch(`/admin/orders/${input.id}/payment-status`, { paymentStatus: input.paymentStatus })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useCancelOrderAsAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/admin/orders/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

export function useOrdersByPickupPoint(pickupPointId: string | null) {
  return useQuery({
    enabled: Boolean(pickupPointId),
    queryKey: ["admin", "orders", "pickup", pickupPointId],
    queryFn: async () => (await api.get("/admin/orders/by-pickup-point", { params: { pickupPointId } })).data,
  });
}
