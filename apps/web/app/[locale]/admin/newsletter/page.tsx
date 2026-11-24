"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSubscribers, useSendNewsletter } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminNewsletterPage() {
  const { data: subscribers, isLoading } = useSubscribers();
  const sendNewsletter = useSendNewsletter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"subscribers" | "customers" | "both">("subscribers");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await sendNewsletter.mutateAsync({ subject, body, audience });
      // Sending continues in the background, so this is a queued count.
      toast.success(`Sending to ${result.queued} recipient(s)`);
      setSubject("");
      setBody("");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not send campaign");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Newsletter</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compose campaign ({subscribers?.length ?? 0} subscribers)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSend}>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="audience">
                Send to
              </label>
              <select
                id="audience"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
              >
                <option value="subscribers">Newsletter subscribers</option>
                <option value="customers">Registered customers</option>
                <option value="both">Subscribers and customers</option>
              </select>
            </div>
            <textarea
              className="w-full rounded-md border p-2 text-sm"
              rows={6}
              placeholder="Email body (HTML supported)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <Button type="submit" disabled={sendNewsletter.isPending || isLoading}>
              Send campaign
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
