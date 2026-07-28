"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ConversationMessage {
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: { id: string; name: string; avatarUrl?: string; role: string }[];
  productId?: { id: string; name: string; slug: string; images: string[] };
  messages: ConversationMessage[];
  lastMessageAt: string;
}

export function useMyConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await api.get<{ items: Conversation[] }>("/conversations")).data.items,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: async () => (await api.get<Conversation>(`/conversations/${id}`)).data,
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { otherUserId: string; productId?: string; message: string }) =>
      (await api.post<Conversation>("/conversations", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; body: string }) =>
      (await api.post<Conversation>(`/conversations/${input.id}/messages`, { body: input.body })).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAdminConversations() {
  return useQuery({
    queryKey: ["conversations", "admin"],
    queryFn: async () => (await api.get<{ items: Conversation[] }>("/conversations/admin")).data.items,
  });
}
