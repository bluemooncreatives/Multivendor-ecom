"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "product-referral";
/** Legacy kept the share cookie for 30 days; the same window is used here. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredReferral {
  productId: string;
  code: string;
  at: number;
}

/**
 * Affiliate share links.
 *
 * The legacy storefront put `referred_product_id` and `product_referral_code` in
 * cookies when a shopper opened a product through someone's share link, and the
 * cart copied them onto the line so the sharer earned a commission
 * (`CartController@addToCart`). The rewrite had no equivalent, so share links paid
 * nobody. This keeps the same pairing - a code is only ever applied to the product
 * it was shared for - in localStorage, which is per-browser and never sent anywhere
 * except as the referral code on that product's cart line.
 */
export function useReferralCode(productId?: string) {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    const fromUrl = searchParams.get("ref");

    try {
      if (fromUrl) {
        const entry: StoredReferral = { productId, code: fromUrl, at: Date.now() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
        setCode(fromUrl);
        return;
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredReferral;
      // Only for the product it was shared for, and only while it is still fresh.
      if (stored.productId !== productId || Date.now() - stored.at > TTL_MS) return;
      setCode(stored.code);
    } catch {
      // Private mode or blocked storage: share attribution is simply not applied.
    }
  }, [productId, searchParams]);

  return code;
}
