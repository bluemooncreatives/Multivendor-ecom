"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => (await api.get<Wallet>("/me/wallet")).data,
  });
}

export function useWalletHistory() {
  return useQuery({
    queryKey: ["wallet", "history"],
    queryFn: async () => (await api.get<{ items: WalletTransaction[] }>("/me/wallet/history")).data.items,
  });
}

export interface ManualPaymentMethod {
  id: string;
  name: string;
  instructions: string;
}

export function useManualPaymentMethods() {
  return useQuery({
    queryKey: ["payments", "manual-methods"],
    queryFn: async () => (await api.get<{ items: ManualPaymentMethod[] }>("/payments/manual-methods")).data.items,
  });
}

export interface RechargeRequest {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function useMyRechargeRequests() {
  return useQuery({
    queryKey: ["wallet", "recharge"],
    queryFn: async () => (await api.get<{ items: RechargeRequest[] }>("/me/wallet/recharge")).data.items,
  });
}

export function useCreateRechargeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; methodId: string; proofUrl: string }) =>
      (await api.post<RechargeRequest>("/me/wallet/recharge", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallet", "recharge"] }),
  });
}
