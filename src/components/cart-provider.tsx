"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Product } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: Product, quantity?: number, variation?: string) => void;
  remove: (productId: string, variation?: string) => void;
  update: (productId: string, quantity: number, variation?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "v4local_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
      setLines(Array.isArray(stored) ? stored.filter((line): line is CartLine => Boolean(line && typeof line === "object" && typeof line.productId === "string" && typeof line.name === "string" && typeof line.slug === "string" && typeof line.price === "number" && Number.isFinite(line.price) && line.price >= 0 && typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100)) : []);
    } catch { setLines([]); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines)); }, [hydrated, lines]);
  const add = useCallback((product: Product, quantity = 1, variation?: string) => setLines((current) => {
    const variant = variation ? product.variants.find((candidate) => candidate.name === variation) : undefined;
    const stock = variant ? variant.stock : product.stock;
    if (stock <= 0 || (product.variants.length > 0 && !variant)) return current;
    const safeQuantity = Math.min(stock, 100, Math.max(product.minQuantity, Math.trunc(quantity) || product.minQuantity));
    const existing = current.find((line) => line.productId === product.id && (line.variation || "") === (variation || ""));
    if (existing) return current.map((line) => line.productId === product.id && (line.variation || "") === (variation || "") ? { ...line, quantity: Math.min(stock, 100, line.quantity + safeQuantity) } : line);
    const basePrice = variant?.price ?? product.price;
    const price = product.discountType === "percent" ? basePrice * (1 - Math.min(product.discount, 100) / 100) : Math.max(0, basePrice - product.discount);
    return [...current, { productId: product.id, name: product.name, slug: product.slug, image: product.thumbnail, price: Math.round(price * 100) / 100, quantity: safeQuantity, variation }];
  }), []);
  const remove = useCallback((productId: string, variation?: string) => setLines((current) => current.filter((line) => !(line.productId === productId && (line.variation || "") === (variation || "")))), []);
  const update = useCallback((productId: string, quantity: number, variation?: string) => setLines((current) => current.map((line) => line.productId === productId && (line.variation || "") === (variation || "") ? { ...line, quantity: Math.min(100, Math.max(1, Math.trunc(quantity) || 1)) } : line)), []);
  const clear = useCallback(() => setLines([]), []);
  const value = useMemo(() => ({ lines, count: lines.reduce((sum, line) => sum + line.quantity, 0), total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0), add, remove, update, clear }), [lines, add, remove, update, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
