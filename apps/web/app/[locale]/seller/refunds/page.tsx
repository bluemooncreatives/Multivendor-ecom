"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import { useSellerRefundRequests, useSellerDecideRefund } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

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
      <PageHeader
        title="Refund requests"
        description="Your decision is a recommendation — approved requests go to the platform for payout, so no money leaves your balance until an admin settles it."
      />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !requests || requests.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No refund requests" description="No refund requests for your shop." />
      ) : (
        <div className="space-y-3">
          {requests.map((request: RefundRequest) => (
            <RefundCard key={request.id} request={request} />
          ))}
        </div>
      )}
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
      toast.error(getApiErrorMessage(err, "Could not record your decision"));
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
        <CardTitle className="text-base">{formatPrice(request.amount)}</CardTitle>
        <StatusBadge status={request.status} />
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        <p className="rounded-md bg-muted/50 p-2.5 text-xs">{request.reason}</p>
        <p className="text-xs text-muted-foreground">Opened {new Date(request.createdAt).toLocaleDateString()}</p>

        {request.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {request.images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Customer evidence" className="h-20 w-20 rounded-md border object-cover" />
            ))}
          </div>
        )}

        {request.status === "pending" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Input
              placeholder="Note for the customer (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="max-w-sm"
            />
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
