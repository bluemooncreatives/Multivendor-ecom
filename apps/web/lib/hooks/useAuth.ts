"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore, useGuestStore } from "@/lib/store";
import type { User } from "@ecommercemultivendor/types";

interface AuthResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const guestId = useGuestStore((s) => s.guestId);

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) =>
      (await api.post<AuthResponse>("/auth/login", input)).data,
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      setSession(null, data.accessToken, data.refreshToken);
      // Merge whatever the shopper added to the cart before logging in.
      await api.post("/cart/merge", { guestId }, { headers: { Authorization: `Bearer ${data.accessToken}` } }).catch(() => {});
      const me = (await api.get<User>("/auth/me", { headers: { Authorization: `Bearer ${data.accessToken}` } })).data;
      setSession(me, data.accessToken, data.refreshToken);
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      password: string;
      role?: "customer" | "seller";
      referralCode?: string;
    }) => (await api.post<AuthResponse>("/auth/register", input)).data,
    onSuccess: async (data) => {
      setAccessToken(data.accessToken);
      const me = (await api.get<User>("/auth/me", { headers: { Authorization: `Bearer ${data.accessToken}` } })).data;
      setSession(me, data.accessToken, data.refreshToken);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: async () => api.post("/auth/logout", { refreshToken }),
    onSuccess: () => {
      setAccessToken(null);
      clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string) => api.post("/auth/verify-email", { token }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => api.post("/auth/forgot-password", { email }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; password: string }) => api.post("/auth/reset-password", input),
  });
}

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["me"],
    enabled: !!accessToken,
    queryFn: async () => (await api.get<User>("/auth/me")).data,
  });
}
