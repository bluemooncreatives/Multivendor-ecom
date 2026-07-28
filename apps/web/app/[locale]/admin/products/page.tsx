"use client";

import { usePendingProducts, useModerateProduct } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export default function AdminProductsPage() {
  const { data: products, isLoading } = usePendingProducts();
  const moderate = useModerateProduct();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Product moderation</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !products || products.length === 0 ? (
        <p className="text-muted-foreground">No products awaiting review.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-base">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">{formatPrice(product.basePrice, product.currency)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moderate.mutate({ id: product.id, approved: true })}>
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => moderate.mutate({ id: product.id, approved: false })}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
