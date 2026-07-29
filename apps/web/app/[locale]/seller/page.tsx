"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSellerLedgerSummary, useSellerProducts, useSellerOrders, useMyShop } from "@/lib/hooks/useSeller";
import { useMySellerSubscription } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export default function SellerOverviewPage() {
  const locale = useLocale();
  const { data: summary } = useSellerLedgerSummary();
  const { data: products } = useSellerProducts();
  const { data: orders } = useSellerOrders();
  const { data: shop } = useMyShop();
  const { data: subscription } = useMySellerSubscription();
  const activePackage = subscription?.subscription?.packageId as { name?: string } | null | undefined;

  // Last 30 days of takings, bucketed by day. Computed from the orders already
  // loaded for the counters rather than a second request.
  const salesSeries = useMemo(() => {
    const days = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.set(date.toISOString().slice(0, 10), 0);
    }

    for (const order of orders ?? []) {
      const day = String(order.createdAt).slice(0, 10);
      if (!days.has(day)) continue; // older than the window
      const mine = order.details.reduce(
        (sum: number, detail: { subtotal?: number }) => sum + (detail.subtotal ?? 0),
        0,
      );
      days.set(day, (days.get(day) ?? 0) + mine);
    }

    return [...days.entries()].map(([date, total]) => ({
      date: date.slice(5), // MM-DD is enough on a 30-day axis
      total: Math.round(total * 100) / 100,
    }));
  }, [orders]);

  const pendingProducts = (products ?? []).filter((p) => !p.published).length;
  const openOrders = (orders ?? []).filter(
    (order: { status: string }) => !["delivered", "cancelled", "refunded"].includes(order.status),
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seller dashboard</h1>

      {/* Verification and subscription state first: both gate what a seller can
          do, so they belong above the numbers rather than buried in a sub-page. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted-foreground">Shop verification</CardTitle>
            {shop?.verified ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {shop?.verificationStatus ?? "Not started"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {shop?.verified ? (
              <p className="text-sm text-muted-foreground">Your storefront is verified and visible in search.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Unverified shops are hidden from search results. Complete verification to be listed.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${locale}/seller/shop`}>Complete verification</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm text-muted-foreground">Subscription</CardTitle>
            {activePackage?.name ? (
              <Badge variant="secondary">{activePackage.name}</Badge>
            ) : (
              <Badge variant="outline">None</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {subscription?.subscription?.expiresAt ? (
              <p className="text-sm text-muted-foreground">
                Expires {new Date(subscription.subscription.expiresAt).toLocaleDateString()} ·{" "}
                {subscription.remaining ?? "unlimited"} product slots left
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Buy a package to raise your product limit.</p>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href={`/${locale}/seller/package`}>Manage package</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available balance" value={formatPrice(summary?.available ?? 0)} />
        <StatCard label="Products" value={String(products?.length ?? 0)} hint={pendingProducts > 0 ? `${pendingProducts} awaiting approval` : undefined} />
        <StatCard label="Orders" value={String(orders?.length ?? 0)} hint={openOrders > 0 ? `${openOrders} still open` : undefined} />
        <StatCard label="Withdrawn" value={formatPrice(summary?.withdrawn ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales, last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {salesSeries.every((point) => point.total === 0) ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No sales recorded in the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Area type="monotone" dataKey="total" strokeWidth={2} className="fill-primary/20 stroke-primary" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
