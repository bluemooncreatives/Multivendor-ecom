"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TicketReply {
  authorId: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: "open" | "answered" | "closed";
  replies: TicketReply[];
  createdAt: string;
}

export function useMyTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => (await api.get<{ items: Ticket[] }>("/me/tickets")).data.items,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; message: string }) => (await api.post<Ticket>("/me/tickets", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useReplyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; message: string }) =>
      (await api.post<Ticket>(`/me/tickets/${input.id}/reply`, { message: input.message })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}
