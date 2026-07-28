import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@ecommercemultivendor/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: User | null, accessToken: string | null, refreshToken: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "auth-store" },
  ),
);

// Anonymous shoppers get a stable UUID (sent as the X-Guest-Id header) so their
// cart survives a page reload without requiring an account.
interface GuestState {
  guestId: string;
}

function createGuestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useGuestStore = create<GuestState>()(
  persist((_set) => ({ guestId: createGuestId() }), { name: "guest-store" }),
);

// Compare list is purely client-side (matches the legacy app's session-based
// compare feature) — no server round trip needed, just a capped list of ids.
const MAX_COMPARE_ITEMS = 4;

interface CompareState {
  productIds: string[];
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const { productIds } = get();
        if (productIds.includes(productId)) {
          set({ productIds: productIds.filter((id) => id !== productId) });
        } else {
          set({ productIds: [...productIds, productId].slice(-MAX_COMPARE_ITEMS) });
        }
      },
      remove: (productId) => set({ productIds: get().productIds.filter((id) => id !== productId) }),
      clear: () => set({ productIds: [] }),
    }),
    { name: "compare-store" },
  ),
);
