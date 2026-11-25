"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAuthOptions() {
  return useQuery({ queryKey: ["auth-options"], queryFn: async () => (await api.get<{
    providers: ("google" | "facebook" | "twitter")[];
    phone: { login: boolean; registration: boolean; verification: boolean; passwordReset: boolean; registrationRequired: boolean };
    recaptcha: { enabled: boolean; siteKey: string };
  }>("/auth/options")).data });
}
