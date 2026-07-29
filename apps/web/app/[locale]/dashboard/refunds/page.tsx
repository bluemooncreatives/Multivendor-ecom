"use client";

import { useMyRefundRequests } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

const STATUS_COPY: Record<string, string> = {
  pending: "Waiting for the seller to review your request.",
  approved: "The seller approved it — the platform is processing your refund.",
  rejected: "This request was declined.",
  refunded: "Refunded to your wallet balance.",
};

export default function MyRefundsPage() {
  const { data: requests, isLoading } = useMyRefundRequests();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Refund requests</h1>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {requests?.length === 0 && (
        <p className="text-muted-foreground">
          You have not requested any refunds. You can start one from a delivered order.
        </p>
      )}

      <div className="space-y-3">
        {requests?.map(
          (request: { id: string; amount: number; reason: string; status: string; createdAt: string; resolutionNote?: string }) => (
            <Card key={request.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{formatPrice(request.amount)}</CardTitle>
                <Badge variant={request.status === "refunded" ? "default" : "outline"}>{request.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{STATUS_COPY[request.status]}</p>
                <p className="rounded bg-muted p-2 text-xs">{request.reason}</p>
                {request.resolutionNote && <p className="text-xs">Response: {request.resolutionNote}</p>}
                <p className="text-xs text-muted-foreground">Opened {new Date(request.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
