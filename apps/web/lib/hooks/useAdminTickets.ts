"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Ticket } from "@/lib/hooks/useTickets";

export function useAdminTickets() {
  return useQuery({
    queryKey: ["admin", "tickets"],
    queryFn: async () => (await api.get<{ items: Ticket[] }>("/admin/tickets")).data.items,
  });
}

export function useAdminReplyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; message: string }) =>
      (await api.post<Ticket>(`/admin/tickets/${input.id}/reply`, { message: input.message })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] }),
  });
}
