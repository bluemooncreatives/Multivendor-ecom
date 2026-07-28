"use client";

import { useAdminConversations } from "@/lib/hooks/useConversations";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminConversationsPage() {
  const { data: conversations, isLoading } = useAdminConversations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Conversations oversight</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !conversations || conversations.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        conversations.map((conv) => (
          <Card key={conv.id}>
            <CardContent className="space-y-1 pt-6 text-sm">
              <p className="font-medium">{conv.participantIds.map((p) => p.name).join(" ↔ ")}</p>
              <p className="text-muted-foreground">{conv.messages.length} message(s) · last at {new Date(conv.lastMessageAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
