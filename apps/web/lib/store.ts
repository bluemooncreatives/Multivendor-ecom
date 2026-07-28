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
