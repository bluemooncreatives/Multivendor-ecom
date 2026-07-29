"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TaxonomyNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: 0 | 1 | 2;
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface AttributeOption {
  id: string;
  name: string;
  values: string[];
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ProductVariantInput {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  comparePrice?: number;
  stock: number;
  imageUrl?: string;
}

// Mirrors the API's productSchema. Kept in one place so the seller form, the
// admin form and the edit page cannot drift apart on which fields they send.
export interface ProductFormInput {
  name: string;
  slug: string;
  categoryId: string;
  subCategoryId: string | null;
  subSubCategoryId: string | null;
  brandId: string | null;
  description: string;
  images: string[];
  thumbnailUrl: string | null;
  basePrice: number;
  purchasePrice: number;
  unit: string;
  barcode: string | null;
  discount: number;
  discountType: "flat" | "percent";
  tax: number | null;
  taxType: "flat" | "percent";
  shippingType: "free" | "flat_rate";
  shippingCost: number;
  variants: ProductVariantInput[];
  colors: string[];
  choiceOptions: { name: string; values: string[] }[];
  minOrderQty: number;
  isDigital: boolean;
  digitalFileUrl: string | null;
  refundable: boolean;
  videoProvider: "youtube" | "dailymotion" | "vimeo" | null;
  videoLink: string | null;
  pdfSpecUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaImageUrl: string | null;
  clubPoints: number;
  tags: string[];
}

// --- Cascade lookups ----------------------------------------------------------
// `enabled` keeps each level idle until its parent is chosen, so opening the form
// doesn't fire three empty queries.

export function useChildCategories(parentId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["catalog", "children", parentId ?? "root"],
    queryFn: async () =>
      (
        await api.get<{ items: TaxonomyNode[] }>("/catalog/categories/children", {
          params: parentId ? { parentId } : {},
        })
      ).data.items,
    enabled,
  });
}

export function useBrandsForCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ["catalog", "brands-for", categoryId],
    queryFn: async () =>
      (await api.get<{ items: BrandOption[] }>("/catalog/categories/brands", { params: { categoryId } })).data.items,
    enabled: Boolean(categoryId),
  });
}

export function useAttributesForCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ["catalog", "attributes-for", categoryId],
    queryFn: async () =>
      (await api.get<{ items: AttributeOption[] }>("/catalog/categories/attributes", { params: { categoryId } })).data
        .items,
    enabled: Boolean(categoryId),
  });
}

export function useColors() {
  return useQuery({
    queryKey: ["catalog", "colors"],
    queryFn: async () => (await api.get<{ items: ColorOption[] }>("/catalog/colors")).data.items,
  });
}

// --- Variant generation -------------------------------------------------------

// The cartesian expansion runs server-side so the client can't submit variants
// with attribute sets that don't match what it claims to have generated.
export function useGenerateSkuCombinations(scope: "seller" | "admin") {
  return useMutation({
    mutationFn: async (input: { baseSku: string; basePrice: number; attributes: Record<string, string[]> }) =>
      (await api.post<{ variants: ProductVariantInput[] }>(`/catalog/${scope}/products/sku-combinations`, input)).data
        .variants,
  });
}

// --- Uploads ------------------------------------------------------------------

export interface StoredFile {
  url: string;
  key: string;
  size: number;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: "image" | "document" | "digital" }) => {
      const formData = new FormData();
      formData.append("file", file);
      return (
        await api.post<StoredFile>("/uploads", formData, {
          params: { kind },
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
  });
}

export function useUploadFiles() {
  return useMutation({
    mutationFn: async ({ files, kind }: { files: File[]; kind: "image" | "document" | "digital" }) => {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      return (
        await api.post<{ items: StoredFile[] }>("/uploads/batch", formData, {
          params: { kind },
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data.items;
    },
  });
}
