"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SearchSuggestions {
  products: { id: string; name: string; slug: string; imageUrl?: string; basePrice: number }[];
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
  shops: { id: string; name: string; slug: string }[];
}

const EMPTY: SearchSuggestions = { products: [], categories: [], brands: [], shops: [] };

// Fires per keystroke, so it stays disabled below 2 characters (matching the
// server's own floor) and keeps results briefly cached to avoid refetching
// while the shopper backspaces through a term they already typed.
export function useSearchSuggestions(query: string) {
  const term = query.trim();
  return useQuery({
    enabled: term.length >= 2,
    queryKey: ["search", "suggestions", term],
    queryFn: async () => (await api.get<SearchSuggestions>("/catalog/search/suggestions", { params: { q: term } })).data,
    placeholderData: (previous) => previous ?? EMPTY,
    staleTime: 30_000,
  });
}

export function usePopularSearches() {
  return useQuery({
    queryKey: ["search", "popular"],
    queryFn: async () => (await api.get<{ items: { query: string; count: number }[] }>("/catalog/search/popular")).data.items,
    staleTime: 5 * 60_000,
  });
}
