"use client";

import { useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { useAdminTickets, useAdminReplyTicket } from "@/lib/hooks/useAdminTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";

export default function AdminTicketsPage() {
  const { data: tickets, isLoading } = useAdminTickets();
  const reply = useAdminReplyTicket();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" description="Respond to customer and seller support inquiries." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !tickets || tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="Incoming support tickets will appear here." />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: { id: string; subject: string; status: string; userId?: { name?: string }; replies: { message: string }[] }) => (
            <Card key={ticket.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="text-base">
                  {ticket.subject}{" "}
                  {ticket.userId?.name && <span className="text-sm font-normal text-muted-foreground">— {ticket.userId.name}</span>}
                </CardTitle>
                <StatusBadge status={ticket.status} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                  {ticket.replies.map((r, i) => (
                    <p key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                      {r.message}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Reply…"
                    value={drafts[ticket.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [ticket.id]: e.target.value })}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const msg = drafts[ticket.id];
                      if (!msg) return;
                      reply.mutate({ id: ticket.id, message: msg });
                      setDrafts({ ...drafts, [ticket.id]: "" });
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
