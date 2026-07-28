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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await sendNewsletter.mutateAsync({ subject, body });
      toast.success(`Sent to ${result.sent} subscriber(s)`);
      setSubject("");
      setBody("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not send campaign");
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
