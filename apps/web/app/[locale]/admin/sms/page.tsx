"use client";

import { useEffect, useState } from "react";
import {
  useOtpSettings,
  useSaveOtpSettings,
  useSaveOtpCredentials,
  useSendBulkSms,
  useSmsLogs,
  useOrderSmsDeliveries,
  type OtpSettings,
} from "@/lib/hooks/useAdminPeople";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";

export default function AdminSmsPage() {
  const { data: settings } = useOtpSettings();
  const saveSettings = useSaveOtpSettings();
  const saveCredentials = useSaveOtpCredentials();
  const sendSms = useSendBulkSms();
  const { data: logs } = useSmsLogs();
  const { data: deliveries } = useOrderSmsDeliveries();

  const [form, setForm] = useState<OtpSettings | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const credentialFields: { key: string; label: string; secret?: boolean }[] =
    form?.provider === "twilio"
      ? [
          { key: "accountSid", label: "Account SID" },
          { key: "authToken", label: "Auth token", secret: true },
          { key: "from", label: "Send from number" },
        ]
      : form?.provider === "nexmo"
        ? [
            { key: "apiKey", label: "API key", secret: true },
            { key: "apiSecret", label: "API secret", secret: true },
            { key: "from", label: "Sender" },
            { key: "entityId", label: "DLT entity ID (if required)" },
            { key: "templateId", label: "DLT content ID (if required)" },
          ]
        : form?.provider === "ssl_wireless"
          ? [
              { key: "apiKey", label: "API token", secret: true },
              { key: "sid", label: "SID" },
            ]
          : form?.provider === "msg91"
            ? [
                { key: "apiKey", label: "Auth key", secret: true },
                { key: "from", label: "Sender" },
                { key: "templateId", label: "DLT template ID (if required)" },
              ]
            : form?.provider === "fast2sms"
              ? [
                  { key: "apiKey", label: "API key", secret: true },
                  { key: "from", label: "DLT sender" },
                  { key: "entityId", label: "DLT entity ID" },
                  { key: "templateId", label: "DLT template ID" },
                ]
              : [];

  const [selectedPhones, setSelectedPhones] = useState("");
  const [blast, setBlast] = useState<{ message: string; audience: "all" | "customers" | "sellers" | "explicit" }>({
    message: "",
    audience: "customers",
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  return (
    <div className="space-y-6">
      <PageHeader title="SMS & OTP" description="Configure OTP providers, order notification triggers, and bulk SMS campaigns." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">OTP settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {form?.usesEnvironmentVerify && (
            <Alert variant="info">
              <AlertDescription>
                Phone codes currently use the environment&apos;s Twilio Verify configuration. Saving provider settings or
                credentials switches phone verification to the database configuration.
              </AlertDescription>
            </Alert>
          )}
          {form && (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const { id: _id, ...payload } = form;
                saveSettings.mutate(payload);
              }}
            >
              <FormField label="Provider" htmlFor="provider">
                <NativeSelect
                  id="provider"
                  value={form.provider}
                  onChange={(e) => {
                    setCredentials({});
                    setForm({ ...form, provider: e.target.value as OtpSettings["provider"] });
                  }}
                >
                  <option value="none">Disabled</option>
                  <option value="twilio">Twilio</option>
                  <option value="nexmo">Nexmo / Vonage</option>
                  <option value="msg91">MSG91</option>
                  <option value="ssl_wireless">SSL Wireless</option>
                  <option value="fast2sms">Fast2SMS</option>
                </NativeSelect>
              </FormField>
              <FormField label="Sender ID" htmlFor="senderId">
                <Input id="senderId" value={form.senderId ?? ""} onChange={(e) => setForm({ ...form, senderId: e.target.value })} />
              </FormField>

              <fieldset className="space-y-2.5 rounded-lg border p-4 md:col-span-2">
                <legend className="px-1 text-sm font-semibold">Phone verification</legend>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="otp-reg"
                    checked={form.otpOnRegistration}
                    onCheckedChange={(checked) => setForm({ ...form, otpOnRegistration: checked === true })}
                  />
                  <Label htmlFor="otp-reg" className="cursor-pointer font-normal">
                    Verify phone before registration
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="otp-forgot"
                    checked={form.otpOnForgotPassword}
                    onCheckedChange={(checked) => setForm({ ...form, otpOnForgotPassword: checked === true })}
                  />
                  <Label htmlFor="otp-forgot" className="cursor-pointer font-normal">
                    Allow password reset by phone
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="otp-order"
                    checked={form.otpOnOrderPlacement}
                    onCheckedChange={(checked) => setForm({ ...form, otpOnOrderPlacement: checked === true })}
                  />
                  <Label htmlFor="otp-order" className="cursor-pointer font-normal">
                    Send order placement SMS
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sms-delivery"
                    checked={form.smsOnDeliveryStatus ?? false}
                    onCheckedChange={(checked) => setForm({ ...form, smsOnDeliveryStatus: checked === true })}
                  />
                  <Label htmlFor="sms-delivery" className="cursor-pointer font-normal">
                    Send delivery-status SMS
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sms-payment"
                    checked={form.smsOnPaymentStatus ?? false}
                    onCheckedChange={(checked) => setForm({ ...form, smsOnPaymentStatus: checked === true })}
                  />
                  <Label htmlFor="sms-payment" className="cursor-pointer font-normal">
                    Send payment-status SMS
                  </Label>
                </div>
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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Provider credentials</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Credentials are write-only — once saved they are never sent back to the browser. Leave a field blank to keep it unchanged.
          </p>
          <form
            className="grid gap-4 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const payload = Object.fromEntries(Object.entries(credentials).filter(([, v]) => v));
              saveCredentials.mutate(payload as Record<string, string>, {
                onSuccess: () => setCredentials({}),
              });
            }}
          >
            {credentialFields.map((field) => (
              <FormField key={field.key} label={field.label} htmlFor={`sms-${field.key}`}>
                <Input
                  id={`sms-${field.key}`}
                  type={field.secret ? "password" : "text"}
                  autoComplete="off"
                  value={credentials[field.key] ?? ""}
                  onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                />
              </FormField>
            ))}
            {form?.provider === "fast2sms" && (
              <FormField
                label="Route"
                htmlFor="sms-route"
                hint="DLT manual needs the sender, entity and template IDs. Message text must match your approved template."
              >
                <NativeSelect
                  id="sms-route"
                  value={credentials.route ?? ""}
                  onChange={(e) => setCredentials({ ...credentials, route: e.target.value })}
                >
                  <option value="">Keep existing (default: Quick SMS)</option>
                  <option value="q">Quick SMS</option>
                  <option value="dlt_manual">DLT manual</option>
                </NativeSelect>
              </FormField>
            )}
            <div className="md:col-span-3">
              <Button type="submit" variant="outline" disabled={saveCredentials.isPending || credentialFields.length === 0}>
                Save credentials
              </Button>
              {saveCredentials.data && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Stored: {saveCredentials.data.configuredKeys.join(", ") || "nothing"}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Send a bulk SMS</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendSms.mutate(
                { ...blast, ...(blast.audience === "explicit" ? { phones: selectedPhones.split(/[\s,;]+/).filter(Boolean) } : {}) },
                { onSuccess: () => setBlast({ ...blast, message: "" }) },
              );
            }}
          >
            <FormField label="Audience" htmlFor="audience" className="max-w-xs">
              <NativeSelect
                id="audience"
                value={blast.audience}
                onChange={(e) => setBlast({ ...blast, audience: e.target.value as typeof blast.audience })}
              >
                <option value="customers">Customers</option>
                <option value="sellers">Sellers</option>
                <option value="all">Everyone</option>
                <option value="explicit">Selected phone numbers</option>
              </NativeSelect>
            </FormField>
            {blast.audience === "explicit" && (
              <FormField
                label="Selected phone numbers"
                htmlFor="sms-phones"
                hint="Separate numbers with spaces or commas. Only verified, active accounts are included."
              >
                <Textarea
                  id="sms-phones"
                  rows={3}
                  value={selectedPhones}
                  onChange={(event) => setSelectedPhones(event.target.value)}
                  required
                  placeholder="+919000000001, +919000000002"
                />
              </FormField>
            )}
            <FormField
              label="Message"
              htmlFor="message"
              hint={`${blast.message.length}/600 characters. Only accounts with a verified phone number receive this.`}
            >
              <Textarea
                id="message"
                rows={4}
                maxLength={600}
                value={blast.message}
                onChange={(e) => setBlast({ ...blast, message: e.target.value })}
                required
              />
            </FormField>
            <Button type="submit" disabled={sendSms.isPending}>
              Send
            </Button>
            {sendSms.data && (
              <p className="text-sm text-muted-foreground">
                Accepted by provider for {sendSms.data.sent} of {sendSms.data.recipients} recipient(s); {sendSms.data.failed} failed.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Send history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {logs?.length === 0 && <p className="text-sm text-muted-foreground">No SMS campaigns sent yet.</p>}
          {logs?.map((log: { id: string; message: string; audience: string; recipientCount: number; createdAt: string }) => (
            <div key={log.id} className="rounded-lg border p-3.5 text-sm">
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

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Order SMS status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Sent means the provider accepted the message. Failed attempts retry automatically up to five times; network
            failures can leave delivery uncertain.
          </p>
          {deliveries?.length === 0 && <p className="text-sm text-muted-foreground">No order SMS messages yet.</p>}
          {deliveries?.map((delivery) => (
            <div key={delivery.id} className="rounded-lg border p-3.5 text-sm">
              <p className="font-medium">
                {delivery.phone} · {delivery.status} · {delivery.attempts} attempt(s)
              </p>
              <p className="text-muted-foreground">{delivery.message}</p>
              {delivery.lastError && <p className="text-xs text-destructive">{delivery.lastError}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
