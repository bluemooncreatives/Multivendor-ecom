"use client";

import { useState } from "react";
import { useStockReport, useSalesReport, useSellerSalesReport, useWishlistReport } from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = ["Sales", "Stock", "Sellers", "Wishlist"] as const;

export default function AdminReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Sales");
  const { data: sales } = useSalesReport();
  const { data: stock } = useStockReport();
  const { data: sellers } = useSellerSalesReport();
  const { data: wishlist } = useWishlistReport();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tab === t ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Sales" && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{sales?.orders ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.revenue ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Discounts</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.discount ?? 0)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Tax collected</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{formatPrice(sales?.tax ?? 0)}</CardContent>
          </Card>
        </div>
      )}

      {tab === "Stock" && (
        <div className="divide-y rounded-md border">
          {stock?.slice(0, 100).map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>
                {row.productName} ({row.sku})
              </span>
              <span className={row.available <= 5 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {row.available} available
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "Sellers" && (
        <div className="divide-y rounded-md border">
          {sellers?.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>{row.sellerName}</span>
              <span>
                Sales {formatPrice(row.sales)} · Commission {formatPrice(row.commission)} · Refunds {formatPrice(row.refunds)}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "Wishlist" && (
        <div className="divide-y rounded-md border">
          {wishlist?.map((row: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 text-sm">
              <span>{row.name}</span>
              <span className="text-muted-foreground">{row.count} wishlist adds</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
