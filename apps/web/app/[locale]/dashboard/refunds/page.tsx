"use client";

import { RotateCcw } from "lucide-react";
import { useMyRefundRequests } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
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
      <PageHeader title="Refund requests" description="Monitor the status of your return and refund claims." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !requests || requests.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No refund requests"
          description="You have not requested any refunds. You can start one from a delivered order."
        />
      ) : (
        <div className="space-y-3">
          {requests.map(
            (request: { id: string; amount: number; reason: string; status: string; createdAt: string; resolutionNote?: string }) => (
              <Card key={request.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                  <CardTitle className="text-base">{formatPrice(request.amount)}</CardTitle>
                  <StatusBadge status={request.status} />
                </CardHeader>
                <CardContent className="space-y-2.5 pt-4 text-sm">
                  <p className="text-muted-foreground">{STATUS_COPY[request.status]}</p>
                  <p className="rounded-md bg-muted/50 p-2.5 text-xs">{request.reason}</p>
                  {request.resolutionNote && (
                    <p className="text-xs">
                      <span className="font-semibold">Response: </span>
                      {request.resolutionNote}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Opened {new Date(request.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
