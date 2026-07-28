"use client";

import { useQuery } from "@tanstack/react-query";
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
