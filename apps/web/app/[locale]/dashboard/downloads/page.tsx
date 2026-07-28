"use client";

import toast from "react-hot-toast";
import { useMyDigitalPurchases, useRequestDownload } from "@/lib/hooks/useDigitalProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// The API returns a fresh, short-lived download token per click — never a
// reusable stored link — so this always requests a new one at click time.
export default function DownloadsPage() {
  const { data: purchases, isLoading } = useMyDigitalPurchases();
  const requestDownload = useRequestDownload();

  async function handleDownload(productId: string, orderId: string) {
    try {
      const result = await requestDownload.mutateAsync({ productId, orderId });
      const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/api\/v1$/, "");
      window.open(`${apiOrigin}${result.downloadUrl}`, "_blank");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not generate download link");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Digital downloads</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !purchases || purchases.length === 0 ? (
        <p className="text-muted-foreground">You haven't purchased any digital products yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {purchases.map((purchase) => (
            <Card key={`${purchase.orderId}-${purchase.productId}`}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium">{purchase.name}</p>
                  <p className="text-sm text-muted-foreground">Order {purchase.orderCode}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(purchase.productId, purchase.orderId)}
                  disabled={requestDownload.isPending}
                >
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
