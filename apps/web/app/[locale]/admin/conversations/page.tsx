"use client";

import { MessageSquare } from "lucide-react";
import { useAdminConversations } from "@/lib/hooks/useConversations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";

export default function AdminConversationsPage() {
  const { data: conversations, isLoading } = useAdminConversations();

  return (
    <div className="space-y-6">
      <PageHeader title="Conversations oversight" description="Audit buyer-seller message activity across the marketplace." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !conversations || conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations yet" description="Buyer-seller threads will appear here." />
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Card key={conv.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div>
                  <p className="font-semibold">{conv.participantIds.map((p) => p.name).join(" ↔ ")}</p>
                  <p className="text-xs text-muted-foreground">
                    Last message {new Date(conv.lastMessageAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary">{conv.messages.length} message(s)</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
