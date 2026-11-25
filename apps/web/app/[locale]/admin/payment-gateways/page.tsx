"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGatewayConfigs, useSaveGatewayConfig } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { getApiErrorMessage } from "@/lib/utils";

const GATEWAYS: { code: string; label: string; fieldsHint: string }[] = [
  { code: "sslcommerz", label: "SSLCommerz", fieldsHint: '{"storeId": "", "storePassword": "", "sandbox": true}' },
  { code: "instamojo", label: "Instamojo", fieldsHint: '{"apiKey": "", "authToken": "", "sandbox": true}' },
  { code: "paystack", label: "PayStack", fieldsHint: '{"secretKey": "", "publicKey": ""}' },
  { code: "voguepay", label: "VoguePay", fieldsHint: '{"merchantId": "", "email": ""}' },
  { code: "payhere", label: "Payhere", fieldsHint: '{"merchantId": "", "merchantSecret": "", "sandbox": true}' },
  { code: "ngenius", label: "N-Genius", fieldsHint: '{"apiKey": "", "outletId": "", "sandbox": true}' },
  { code: "paytm", label: "Paytm", fieldsHint: '{"merchantId": "", "merchantKey": "", "website": "WEBSTAGING"}' },
  { code: "mpesa", label: "M-Pesa", fieldsHint: '{"consumerKey": "", "consumerSecret": "", "shortCode": "", "passkey": ""}' },
  { code: "flutterwave", label: "Flutterwave", fieldsHint: '{"publicKey": "", "secretKey": "", "webhookHash": ""}' },
  { code: "twocheckout", label: "2Checkout", fieldsHint: '{"merchantCode": "", "secretWord": ""}' },
];

function GatewayCard({ code, label, fieldsHint }: { code: string; label: string; fieldsHint: string }) {
  const { data: configs } = useGatewayConfigs();
  const save = useSaveGatewayConfig();
  const config = configs?.find((c) => c.code === code);
  const [enabled, setEnabled] = useState(false);
  const [sandbox, setSandbox] = useState(true);
  const [credentialsText, setCredentialsText] = useState("{}");

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setSandbox(config.sandbox);
    }
  }, [config, fieldsHint]);

  async function handleSave() {
    try {
      const credentials = JSON.parse(credentialsText);
      if (!credentials || Array.isArray(credentials) || typeof credentials !== "object") {
        throw new Error("Use a JSON object");
      }
      await save.mutateAsync({ code, enabled, sandbox, credentials });
      setCredentialsText("{}");
      toast.success(`${label} settings saved`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Check the credential JSON and try again"));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">{label}</CardTitle>
        <StatusBadge status={enabled ? "enabled" : "disabled"} />
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(checked === true)} />
          <span>Enable this gateway</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={sandbox} onCheckedChange={(checked) => setSandbox(checked === true)} />
          <span>Use sandbox</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Configured: {config?.configuredFields.join(", ") || "None"}. Omitted fields keep their saved values.
        </p>
        <Textarea
          className="font-mono text-xs"
          rows={4}
          value={credentialsText}
          placeholder={fieldsHint}
          aria-label={`${label} credentials to update`}
          onChange={(e) => setCredentialsText(e.target.value)}
        />
        <p className="break-all font-mono text-xs text-muted-foreground">Fields: {fieldsHint}</p>
        <Button size="sm" onClick={handleSave} disabled={save.isPending}>
          Save
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminPaymentGatewaysPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment gateways"
        description="Stripe, Razorpay, PayPal, COD, Wallet and Manual are configured via environment variables. The regional gateways below are configured here and stored in the database."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {GATEWAYS.map((g) => (
          <GatewayCard key={g.code} {...g} />
        ))}
      </div>
    </div>
  );
}
