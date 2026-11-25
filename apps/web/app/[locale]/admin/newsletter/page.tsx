"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { useSubscribers, useSendNewsletter } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

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
      toast.success(`Sending to ${result.queued} recipient(s)`);
      setSubject("");
      setBody("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not send campaign"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Newsletter" description="Compose and broadcast email updates to subscribers and customers." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Compose campaign ({subscribers?.length ?? 0} subscribers)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form className="space-y-4" onSubmit={handleSend}>
            <FormField label="Subject" htmlFor="nl-subject" required>
              <Input id="nl-subject" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </FormField>
            <FormField label="Send to" htmlFor="audience">
              <NativeSelect
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
              >
                <option value="subscribers">Newsletter subscribers</option>
                <option value="customers">Registered customers</option>
                <option value="both">Subscribers and customers</option>
              </NativeSelect>
            </FormField>
            <FormField label="Email body" htmlFor="nl-body" required>
              <Textarea
                id="nl-body"
                rows={6}
                placeholder="Email body (HTML supported)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" disabled={sendNewsletter.isPending || isLoading}>
              Send campaign
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
