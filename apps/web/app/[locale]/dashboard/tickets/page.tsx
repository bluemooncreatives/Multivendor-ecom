"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { LifeBuoy, Send } from "lucide-react";
import { useMyTickets, useCreateTicket, useReplyTicket } from "@/lib/hooks/useTickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { FormField } from "@/components/shared/form-field";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/utils";

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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create ticket"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Open a support ticket or follow up with our team." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">New ticket</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="space-y-4" onSubmit={handleCreate}>
            <FormField label="Subject" htmlFor="ticket-subject" required>
              <Input
                id="ticket-subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Message" htmlFor="ticket-message" required>
              <Textarea
                id="ticket-message"
                rows={3}
                placeholder="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" disabled={createTicket.isPending}>
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <CardGridSkeleton count={2} columns="grid-cols-1" />
      ) : !tickets || tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="Your submitted support tickets will appear here." />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="text-base">{ticket.subject}</CardTitle>
                <StatusBadge status={ticket.status} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                  {ticket.replies.map((reply, i) => (
                    <p key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                      {reply.message}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
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
