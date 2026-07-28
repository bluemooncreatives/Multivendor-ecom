"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Brand, Category, Paginated, Product } from "@ecommercemultivendor/types";

export interface ProductSearchParams {
  q?: string;
  categoryId?: string;
  brandId?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
}

export function useProducts(params: ProductSearchParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get<Paginated<Product>>("/catalog/products", { params })).data,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get<Product>(`/catalog/products/${slug}`)).data,
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ items: Category[] }>("/catalog/categories")).data.items,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await api.get<{ items: Brand[] }>("/catalog/brands")).data.items,
  });
}
