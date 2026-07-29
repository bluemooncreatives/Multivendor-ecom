"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useSellerRefundRequests, useSellerDecideRefund } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

interface RefundRequest {
  id: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  images: string[];
  createdAt: string;
}

export default function SellerRefundsPage() {
  const { data: requests, isLoading } = useSellerRefundRequests();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Refund requests</h1>
      <p className="text-sm text-muted-foreground">
        Your decision is a recommendation — approved requests go to the platform for payout, so no money leaves your balance until
        an admin settles it.
      </p>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {requests?.length === 0 && <p className="text-muted-foreground">No refund requests for your shop.</p>}

      <div className="space-y-3">
        {requests?.map((request: RefundRequest) => (
          <RefundCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}

function RefundCard({ request }: { request: RefundRequest }) {
  const decide = useSellerDecideRefund();
  const [note, setNote] = useState("");

  async function submit(approve: boolean) {
    try {
      await decide.mutateAsync({ id: request.id, approve, resolutionNote: note || undefined });
      toast.success(approve ? "Sent to the platform for payout" : "Request rejected");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not record your decision");
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{formatPrice(request.amount)}</CardTitle>
        <Badge variant={request.status === "pending" ? "outline" : "default"}>{request.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="rounded bg-muted p-2 text-xs">{request.reason}</p>
        <p className="text-xs text-muted-foreground">Opened {new Date(request.createdAt).toLocaleDateString()}</p>

        {request.images.length > 0 && (
          <div className="flex gap-2">
            {request.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Customer evidence" className="h-20 w-20 rounded object-cover" />
            ))}
          </div>
        )}

        {request.status === "pending" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Note for the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-sm" />
            <Button size="sm" disabled={decide.isPending} onClick={() => submit(true)}>
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => submit(false)}>
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
