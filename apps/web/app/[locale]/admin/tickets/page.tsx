"use client";

import { useState } from "react";
import { useAdminTickets, useAdminReplyTicket } from "@/lib/hooks/useAdminTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminTicketsPage() {
  const { data: tickets, isLoading } = useAdminTickets();
  const reply = useAdminReplyTicket();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Support tickets</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !tickets || tickets.length === 0 ? (
        <p className="text-muted-foreground">No support tickets.</p>
      ) : (
        tickets.map((ticket: any) => (
          <Card key={ticket.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {ticket.subject} — <span className="text-sm font-normal text-muted-foreground">{ticket.userId?.name}</span>
              </CardTitle>
              <Badge variant={ticket.status === "closed" ? "outline" : "secondary"}>{ticket.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.replies.map((reply: any, i: number) => (
                <p key={i} className="rounded-md bg-muted p-2 text-sm">
                  {reply.message}
                </p>
              ))}
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
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
