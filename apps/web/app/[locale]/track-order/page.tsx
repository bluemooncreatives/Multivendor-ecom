"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { PackageSearch } from "lucide-react";
import { useTrackOrder } from "@/lib/hooks/useTrackOrder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function TrackOrderPage() {
  const trackOrder = useTrackOrder();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await trackOrder.mutateAsync({ code, phone });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No matching order found"));
    }
  }

  return (
    <div className="container max-w-xl space-y-6 py-12">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <PackageSearch className="h-6 w-6 text-primary" />
          Track your order
        </h1>
        <p className="text-sm text-muted-foreground">Enter your order code and phone number to check live delivery progress.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleSubmit}>
            <FormField label="Order code" htmlFor="track-code" required>
              <Input id="track-code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </FormField>
            <FormField label="Phone number" htmlFor="track-phone" required>
              <Input id="track-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </FormField>
            <div className="flex items-end">
              <Button type="submit" className="w-full sm:w-auto" disabled={trackOrder.isPending}>
                Track
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {trackOrder.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-4">
            <CardTitle className="font-mono text-base">{trackOrder.data.code}</CardTitle>
            <StatusBadge status={trackOrder.data.status} />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {trackOrder.data.details.map((detail, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border bg-muted/10 p-3 text-sm">
                <span className="text-muted-foreground">
                  {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}
                </span>
                <StatusBadge status={detail.status} />
              </div>
            ))}
            <p className="pt-1 text-end text-base font-bold text-primary">
              {formatPrice(trackOrder.data.grandTotal, trackOrder.data.currency)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
