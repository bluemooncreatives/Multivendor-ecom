"use client";

import toast from "react-hot-toast";
import { Download, FileDown } from "lucide-react";
import { useMyDigitalPurchases, useRequestDownload } from "@/lib/hooks/useDigitalProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/utils";

export default function DownloadsPage() {
  const { data: purchases, isLoading } = useMyDigitalPurchases();
  const requestDownload = useRequestDownload();

  async function handleDownload(productId: string, orderId: string) {
    try {
      const result = await requestDownload.mutateAsync({ productId, orderId });
      const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/api\/v1$/, "");
      window.open(`${apiOrigin}${result.downloadUrl}`, "_blank");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not generate download link"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Digital downloads" description="Access files from your completed digital product orders." />

      {isLoading ? (
        <CardGridSkeleton count={2} columns="sm:grid-cols-2" />
      ) : !purchases || purchases.length === 0 ? (
        <EmptyState
          icon={FileDown}
          title="No digital downloads yet"
          description="You haven't purchased any digital products yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {purchases.map((purchase) => (
            <Card key={`${purchase.orderId}-${purchase.productId}`}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{purchase.name}</p>
                  <p className="text-xs text-muted-foreground">Order {purchase.orderCode}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(purchase.productId, purchase.orderId)}
                  disabled={requestDownload.isPending}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
