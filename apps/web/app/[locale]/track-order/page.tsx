"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useTrackOrder } from "@/lib/hooks/useTrackOrder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function TrackOrderPage() {
  const trackOrder = useTrackOrder();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await trackOrder.mutateAsync({ code, phone });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "No matching order found");
    }
  }

  return (
    <div className="container max-w-lg space-y-6 py-16">
      <h1 className="text-2xl font-bold">Track your order</h1>
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-2">
              <Label>Order code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Phone number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit" className="self-end" disabled={trackOrder.isPending}>
              Track
            </Button>
          </form>
        </CardContent>
      </Card>

      {trackOrder.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{trackOrder.data.code}</CardTitle>
            <Badge variant="secondary">{trackOrder.data.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {trackOrder.data.details.map((detail, i) => (
              <div key={i} className="text-sm text-muted-foreground">
                {detail.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")} — <span className="capitalize">{detail.status}</span>
              </div>
            ))}
            <p className="font-semibold">{formatPrice(trackOrder.data.grandTotal, trackOrder.data.currency)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
