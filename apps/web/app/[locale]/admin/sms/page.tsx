"use client";

import { useEffect, useState } from "react";
import {
  useOtpSettings,
  useSaveOtpSettings,
  useSaveOtpCredentials,
  useSendBulkSms,
  useSmsLogs,
  type OtpSettings,
} from "@/lib/hooks/useAdminPeople";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function AdminSmsPage() {
  const { data: settings } = useOtpSettings();
  const saveSettings = useSaveOtpSettings();
  const saveCredentials = useSaveOtpCredentials();
  const sendSms = useSendBulkSms();
  const { data: logs } = useSmsLogs();

  const [form, setForm] = useState<OtpSettings | null>(null);
  const [credentials, setCredentials] = useState({ accountSid: "", authToken: "", from: "" });
  const [blast, setBlast] = useState<{ message: string; audience: "all" | "customers" | "sellers" }>({
    message: "",
    audience: "customers",
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS & OTP</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OTP settings</CardTitle>
        </CardHeader>
        <CardContent>
          {form && (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const { id: _id, ...payload } = form;
                saveSettings.mutate(payload);
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as OtpSettings["provider"] })}
                >
                  <option value="none">Disabled</option>
                  <option value="twilio">Twilio</option>
                  <option value="nexmo">Nexmo / Vonage</option>
                  <option value="msg91">MSG91</option>
                  <option value="ssl_wireless">SSL Wireless</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="senderId">Sender ID</Label>
                <Input id="senderId" value={form.senderId ?? ""} onChange={(e) => setForm({ ...form, senderId: e.target.value })} />
              </div>

              <fieldset className="space-y-2 md:col-span-2">
                <legend className="text-sm font-medium">Require an OTP for</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.otpOnRegistration}
                    onChange={(e) => setForm({ ...form, otpOnRegistration: e.target.checked })}
                  />
                  Registration
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.otpOnForgotPassword}
                    onChange={(e) => setForm({ ...form, otpOnForgotPassword: e.target.checked })}
                  />
                  Password reset
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.otpOnOrderPlacement}
                    onChange={(e) => setForm({ ...form, otpOnOrderPlacement: e.target.checked })}
                  />
                  Order placement
                </label>
              </fieldset>

              <div className="md:col-span-2">
                <Button type="submit" disabled={saveSettings.isPending}>
                  Save settings
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Credentials are write-only — once saved they are never sent back to the browser. Leave a field blank to keep it unchanged.
          </p>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const payload = Object.fromEntries(Object.entries(credentials).filter(([, v]) => v));
              saveCredentials.mutate(payload as Record<string, string>, {
                onSuccess: () => setCredentials({ accountSid: "", authToken: "", from: "" }),
              });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="sid">Account SID / API key</Label>
              <Input id="sid" value={credentials.accountSid} onChange={(e) => setCredentials({ ...credentials, accountSid: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="token">Auth token</Label>
              <Input
                id="token"
                type="password"
                value={credentials.authToken}
                onChange={(e) => setCredentials({ ...credentials, authToken: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="from">Send from number</Label>
              <Input id="from" value={credentials.from} onChange={(e) => setCredentials({ ...credentials, from: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" variant="outline" disabled={saveCredentials.isPending}>
                Save credentials
              </Button>
              {saveCredentials.data && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Stored: {saveCredentials.data.configuredKeys.join(", ") || "nothing"}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send a bulk SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendSms.mutate(blast, { onSuccess: () => setBlast({ ...blast, message: "" }) });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="audience">Audience</Label>
              <select
                id="audience"
                className="h-10 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
                value={blast.audience}
                onChange={(e) => setBlast({ ...blast, audience: e.target.value as typeof blast.audience })}
              >
                <option value="customers">Customers</option>
                <option value="sellers">Sellers</option>
                <option value="all">Everyone</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                maxLength={600}
                value={blast.message}
                onChange={(e) => setBlast({ ...blast, message: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {blast.message.length}/600 characters. Only accounts with a verified phone number receive this.
              </p>
            </div>
            <Button type="submit" disabled={sendSms.isPending}>
              Send
            </Button>
            {sendSms.data && (
              <p className="text-sm text-muted-foreground">
                Delivered to {sendSms.data.sent} of {sendSms.data.recipients} recipient(s); {sendSms.data.failed} failed.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs?.length === 0 && <p className="text-sm text-muted-foreground">No SMS campaigns sent yet.</p>}
          {logs?.map((log: { id: string; message: string; audience: string; recipientCount: number; createdAt: string }) => (
            <div key={log.id} className="rounded-md border p-3 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {log.audience} · {log.recipientCount} recipient(s)
                </span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1">{log.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
