"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useMyConversations, useConversation, useSendMessage } from "@/lib/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ConversationInbox() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: conversations, isLoading } = useMyConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: active } = useConversation(activeId ?? "");
  const sendMessage = useSendMessage();
  const [draft, setDraft] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    await sendMessage.mutateAsync({ id: activeId, body: draft });
    setDraft("");
  }

  return (
    <Card className="grid overflow-hidden md:grid-cols-[300px_1fr]">
      <div className="border-b md:border-b-0 md:border-e">
        <div className="border-b bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Conversations
        </div>
        <ScrollArea className="h-[420px] p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => {
                const other = conv.participantIds.find((p) => p.id !== userId);
                const name = other?.name ?? "User";
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors hover:bg-accent",
                      activeId === conv.id && "bg-primary/10 text-primary",
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      {(conv.title || conv.productId) && (
                        <p className="truncate text-xs text-muted-foreground">{conv.title ?? conv.productId?.name}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex h-[470px] flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={MessageSquare}
              title="No conversation selected"
              description="Choose a thread from the list to view messages and reply."
              className="border-0 bg-transparent py-6"
            />
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2.5">
                {active.messages.map((msg, i) => {
                  const mine = msg.senderId === userId;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mine
                          ? "ms-auto rounded-ee-sm bg-primary text-primary-foreground"
                          : "rounded-es-sm bg-muted text-foreground",
                      )}
                    >
                      {msg.body}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <form className="flex gap-2 border-t bg-muted/20 p-3" onSubmit={handleSend}>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="bg-background"
              />
              <Button type="submit" disabled={sendMessage.isPending || !draft.trim()}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
}
