"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGatewayConfigs, useSaveGatewayConfig } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GATEWAYS: { code: string; label: string; fieldsHint: string }[] = [
  { code: "sslcommerz", label: "SSLCommerz", fieldsHint: '{"storeId": "", "storePassword": "", "sandbox": true}' },
  { code: "instamojo", label: "Instamojo", fieldsHint: '{"apiKey": "", "authToken": "", "sandbox": true}' },
  { code: "paystack", label: "PayStack", fieldsHint: '{"secretKey": "", "publicKey": ""}' },
  { code: "voguepay", label: "VoguePay", fieldsHint: '{"merchantId": ""}' },
  { code: "payhere", label: "Payhere", fieldsHint: '{"merchantId": "", "merchantSecret": "", "sandbox": true}' },
  { code: "ngenius", label: "N-Genius", fieldsHint: '{"apiKey": "", "outletId": "", "sandbox": true}' },
];

function GatewayCard({ code, label, fieldsHint }: { code: string; label: string; fieldsHint: string }) {
  const { data: configs } = useGatewayConfigs();
  const save = useSaveGatewayConfig();
  const config = configs?.find((c) => c.code === code);
  const [enabled, setEnabled] = useState(false);
  const [credentialsText, setCredentialsText] = useState(fieldsHint);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setCredentialsText(JSON.stringify(config.credentials, null, 2) || fieldsHint);
    }
  }, [config, fieldsHint]);

  async function handleSave() {
    try {
      const credentials = JSON.parse(credentialsText);
      await save.mutateAsync({ code, enabled, credentials });
      toast.success(`${label} settings saved`);
    } catch {
      toast.error("Credentials must be valid JSON");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{label}</CardTitle>
        <Badge variant={enabled ? "secondary" : "outline"}>{enabled ? "Enabled" : "Disabled"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable this gateway
        </label>
        <textarea
          className="w-full rounded-md border p-2 font-mono text-xs"
          rows={4}
          value={credentialsText}
          onChange={(e) => setCredentialsText(e.target.value)}
        />
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
      <div>
        <h1 className="text-2xl font-bold">Payment gateways</h1>
        <p className="text-sm text-muted-foreground">
          Stripe, Razorpay, PayPal, COD, Wallet and Manual are configured via environment variables. The regional
          gateways below are configured here and stored in the database.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GATEWAYS.map((g) => (
          <GatewayCard key={g.code} {...g} />
        ))}
      </div>
    </div>
  );
}
