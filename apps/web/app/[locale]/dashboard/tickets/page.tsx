"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMyTickets, useCreateTicket, useReplyTicket } from "@/lib/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TicketsPage() {
  const { data: tickets, isLoading } = useMyTickets();
  const createTicket = useCreateTicket();
  const replyTicket = useReplyTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTicket.mutateAsync({ subject, message });
      setSubject("");
      setMessage("");
      toast.success("Ticket created");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create ticket");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleCreate}>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <textarea
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
              placeholder="How can we help?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <Button type="submit" disabled={createTicket.isPending}>
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        tickets?.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{ticket.subject}</CardTitle>
              <Badge variant={ticket.status === "closed" ? "outline" : "secondary"}>{ticket.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.replies.map((reply, i) => (
                <p key={i} className="rounded-md bg-muted p-2 text-sm">
                  {reply.message}
                </p>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Reply…"
                  value={replyDrafts[ticket.id] ?? ""}
                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [ticket.id]: e.target.value })}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const msg = replyDrafts[ticket.id];
                    if (!msg) return;
                    replyTicket.mutate({ id: ticket.id, message: msg });
                    setReplyDrafts({ ...replyDrafts, [ticket.id]: "" });
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
