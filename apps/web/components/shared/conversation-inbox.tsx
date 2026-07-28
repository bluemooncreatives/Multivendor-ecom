"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useMyConversations, useConversation, useSendMessage } from "@/lib/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="space-y-1 rounded-md border p-2">
        {isLoading ? (
          <p className="p-2 text-sm text-muted-foreground">Loading…</p>
        ) : !conversations || conversations.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          conversations.map((conv) => {
            const other = conv.participantIds.find((p) => p.id !== userId);
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveId(conv.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-start text-sm hover:bg-accent",
                  activeId === conv.id && "bg-accent",
                )}
              >
                <p className="font-medium">{other?.name ?? "User"}</p>
                {conv.productId && <p className="truncate text-xs text-muted-foreground">{conv.productId.name}</p>}
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col rounded-md border p-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select a conversation</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
              {active.messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[75%] rounded-md p-2 text-sm",
                    msg.senderId === userId ? "ms-auto bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {msg.body}
                </div>
              ))}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={handleSend}>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
              <Button type="submit" disabled={sendMessage.isPending}>
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
