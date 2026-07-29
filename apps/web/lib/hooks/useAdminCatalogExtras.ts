"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// --- Attributes / Colors ------------------------------------------------------

export interface Attribute {
  id: string;
  name: string;
  values: string[];
}

export function useAttributes() {
  return useQuery({
    queryKey: ["attributes"],
    queryFn: async () => (await api.get<{ items: Attribute[] }>("/catalog/attributes")).data.items,
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; values: string[] }) => (await api.post("/catalog/attributes", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/catalog/attributes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });
}

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
}

export function useColors() {
  return useQuery({
    queryKey: ["colors"],
    queryFn: async () => (await api.get<{ items: ColorItem[] }>("/catalog/colors")).data.items,
  });
}

export function useCreateColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; hex: string }) => (await api.post("/catalog/colors", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
}

export function useDeleteColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/catalog/colors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
}

// --- Flash deals -----------------------------------------------------------------

export interface FlashDeal {
  id: string;
  title: string;
  bannerUrl?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  products: { productId: string; variantSku: string; discountPercent: number; dealStock: number }[];
}

export function useAdminFlashDeals() {
  return useQuery({
    queryKey: ["admin", "flash-deals"],
    queryFn: async () => (await api.get<{ items: FlashDeal[] }>("/flash-deals/admin/all")).data.items,
  });
}

export function useCreateFlashDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      bannerUrl?: string;
      startsAt: string;
      endsAt: string;
      products: { productId: string; variantSku: string; discountPercent: number; dealStock: number }[];
    }) => (await api.post("/flash-deals/admin", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "flash-deals"] }),
  });
}

export function useDeleteFlashDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/flash-deals/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "flash-deals"] }),
  });
}

// --- Pickup points -----------------------------------------------------------------

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  active: boolean;
}

export function useAdminPickupPoints() {
  return useQuery({
    queryKey: ["admin", "pickup-points"],
    queryFn: async () => (await api.get<{ items: PickupPoint[] }>("/pickup-points/admin")).data.items,
  });
}

export function useCreatePickupPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; address: string; city: string; phone?: string }) =>
      (await api.post("/pickup-points/admin", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pickup-points"] }),
  });
}

export function useDeletePickupPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/pickup-points/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pickup-points"] }),
  });
}

// --- Newsletter -----------------------------------------------------------------

export function useSubscribers() {
  return useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => (await api.get<{ items: { id: string; email: string }[] }>("/newsletter/admin/subscribers")).data.items,
  });
}

export function useSendNewsletter() {
  return useMutation({
    mutationFn: async (input: { subject: string; body: string }) => (await api.post("/newsletter/admin/send", input)).data,
  });
}

// --- Currency / Language / Country CRUD ---------------------------------------

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rateToBase: number;
  decimals: number;
  /** Whether the symbol renders before or after the amount. */
  symbolPosition: "before" | "after";
  active: boolean;
}

export type CurrencyInput = Omit<Currency, "id" | "active"> & { active?: boolean };

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async () => (await api.get<{ items: Currency[] }>("/localization/currencies")).data.items,
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CurrencyInput) => (await api.post("/localization/admin/currencies", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currencies"] }),
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CurrencyInput> & { id: string }) =>
      (await api.patch(`/localization/admin/currencies/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currencies"] }),
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; rtl?: boolean; active?: boolean; name?: string }) =>
      (await api.patch(`/localization/admin/languages/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
}

export interface LanguageItem {
  id: string;
  code: string;
  name: string;
  rtl: boolean;
  active: boolean;
}

export function useLanguages() {
  return useQuery({
    queryKey: ["languages"],
    queryFn: async () => (await api.get<{ items: LanguageItem[] }>("/localization/languages")).data.items,
  });
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; name: string; rtl?: boolean }) =>
      (await api.post("/localization/admin/languages", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["languages"] }),
  });
}

export interface CountryItem {
  id: string;
  code: string;
  name: string;
  defaultCurrency: string;
  active: boolean;
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => (await api.get<{ items: CountryItem[] }>("/localization/countries")).data.items,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; name: string; defaultCurrency?: string }) =>
      (await api.post("/localization/admin/countries", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["countries"] }),
  });
}

// --- CMS: pages / policies / links ------------------------------------------------

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  body: string;
  published: boolean;
}

export function useAdminPages() {
  return useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => (await api.get<{ items: CmsPage[] }>("/cms/admin/pages")).data.items,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { slug: string; title: string; body: string }) => (await api.post("/cms/admin/pages", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }),
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/cms/admin/pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pages"] }),
  });
}

const POLICY_TYPES = ["privacy", "terms", "refund", "shipping", "seller_agreement"] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export function usePolicy(type: PolicyType) {
  return useQuery({
    queryKey: ["policy", type],
    queryFn: async () => (await api.get<{ type: string; body: string }>(`/cms/policies/${type}`)).data,
  });
}

export function useSavePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: PolicyType; body: string }) =>
      (await api.put(`/cms/admin/policies/${input.type}`, { body: input.body })).data,
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: ["policy", variables.type] }),
  });
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  placement: "header" | "footer";
  order: number;
}

export function useLinks(placement?: "header" | "footer") {
  return useQuery({
    queryKey: ["links", placement],
    queryFn: async () => (await api.get<{ items: FooterLink[] }>("/cms/links", { params: { placement } })).data.items,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { label: string; url: string; placement: "header" | "footer" }) =>
      (await api.post("/cms/admin/links", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/cms/admin/links/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
  });
}

// --- Homepage builder --------------------------------------------------------------

export interface Slider {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  active: boolean;
}

export function useAdminSliders() {
  return useQuery({
    queryKey: ["admin", "sliders"],
    queryFn: async () => (await api.get<{ items: Slider[] }>("/homepage/admin/sliders")).data.items,
  });
}

export function useCreateSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { imageUrl: string; linkUrl?: string }) => (await api.post("/homepage/admin/sliders", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sliders"] }),
  });
}

export function useUpdateSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; imageUrl?: string; linkUrl?: string; order?: number; active?: boolean }) =>
      (await api.patch(`/homepage/admin/sliders/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sliders"] }),
  });
}

export function useDeleteSlider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/homepage/admin/sliders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sliders"] }),
  });
}

export interface BannerItem {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string;
  active: boolean;
}

export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => (await api.get<{ items: BannerItem[] }>("/homepage/admin/banners")).data.items,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { imageUrl: string; linkUrl?: string; placement: string }) =>
      (await api.post("/homepage/admin/banners", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; imageUrl?: string; linkUrl?: string; placement?: string; active?: boolean }) =>
      (await api.patch(`/homepage/admin/banners/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/homepage/admin/banners/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "banners"] }),
  });
}

export function useAdminHomeCategories() {
  return useQuery({
    queryKey: ["admin", "home-categories"],
    queryFn: async () => (await api.get("/homepage/admin/home-categories")).data.items,
  });
}

export function useCreateHomeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { categoryId: string }) => (await api.post("/homepage/admin/home-categories", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "home-categories"] }),
  });
}

export function useDeleteHomeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/homepage/admin/home-categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "home-categories"] }),
  });
}

export function useToggleTopCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; featured: boolean }) =>
      (await api.patch(`/homepage/admin/top-categories/${input.id}`, { featured: input.featured })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useToggleTopBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; featured: boolean }) =>
      (await api.patch(`/homepage/admin/top-brands/${input.id}`, { featured: input.featured })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// --- Reports -----------------------------------------------------------------------

export function useStockReport() {
  return useQuery({
    queryKey: ["admin", "reports", "stock"],
    queryFn: async () => (await api.get("/admin/reports/stock")).data.items,
  });
}

export function useSalesReport() {
  return useQuery({
    queryKey: ["admin", "reports", "sales"],
    queryFn: async () => (await api.get("/admin/reports/sales")).data,
  });
}

export function useSellerSalesReport() {
  return useQuery({
    queryKey: ["admin", "reports", "sellers"],
    queryFn: async () => (await api.get("/admin/reports/sellers")).data.items,
  });
}

export function useWishlistReport() {
  return useQuery({
    queryKey: ["admin", "reports", "wishlist"],
    queryFn: async () => (await api.get("/admin/reports/wishlist")).data.items,
  });
}

// --- Extra payment gateway credentials --------------------------------------------

export interface PaymentGatewayConfig {
  id: string;
  code: string;
  enabled: boolean;
  credentials: Record<string, unknown>;
}

export function useGatewayConfigs() {
  return useQuery({
    queryKey: ["admin", "gateways"],
    queryFn: async () => (await api.get<{ items: PaymentGatewayConfig[] }>("/payments/admin/gateways")).data.items,
  });
}

export function useSaveGatewayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; enabled: boolean; credentials: Record<string, unknown> }) =>
      (await api.put(`/payments/admin/gateways/${input.code}`, { enabled: input.enabled, credentials: input.credentials })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "gateways"] }),
  });
}

// --- Impersonation -----------------------------------------------------------------

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => (await api.post(`/admin/users/${userId}/impersonate`)).data,
  });
}
