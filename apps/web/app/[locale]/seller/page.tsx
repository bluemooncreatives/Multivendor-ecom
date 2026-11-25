"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wallet,
  Package,
  ShoppingBag,
  ArrowDownToLine,
  ArrowRight,
  Store,
  Sparkles,
} from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { formatPrice } from "@/lib/format";

export default function SellerOverviewPage() {
  const locale = useLocale();
  const { data: summary } = useSellerLedgerSummary();
  const { data: products } = useSellerProducts();
  const { data: orders } = useSellerOrders();
  const { data: shop } = useMyShop();
  const { data: subscription } = useMySellerSubscription();
  const activePackage = subscription?.subscription?.packageId as { name?: string } | null | undefined;

  const salesSeries = useMemo(() => {
    const days = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.set(date.toISOString().slice(0, 10), 0);
    }

    for (const order of orders ?? []) {
      const day = String(order.createdAt).slice(0, 10);
      if (!days.has(day)) continue;
      const mine = order.details.reduce(
        (sum: number, detail: { subtotal?: number }) => sum + (detail.subtotal ?? 0),
        0,
      );
      days.set(day, (days.get(day) ?? 0) + mine);
    }

    return [...days.entries()].map(([date, total]) => ({
      date: date.slice(5),
      total: Math.round(total * 100) / 100,
    }));
  }, [orders]);

  const pendingProducts = (products ?? []).filter((p) => !p.published).length;
  const openOrders = (orders ?? []).filter(
    (order: { status: string }) => !["delivered", "cancelled", "refunded"].includes(order.status),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Dashboard"
        description="Monitor shop verification, subscription limits, orders, and 30-day revenue."
        actions={
          <Button asChild size="sm" className="rounded-xl font-bold">
            <Link href={`/${locale}/seller/products`}>
              Manage Products
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden rounded-3xl shadow-xs">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Store className="h-4 w-4 text-primary" />
              Shop Verification
            </CardTitle>
            {shop?.verified ? (
              <Badge variant="success" className="gap-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 rounded-full capitalize">
                <Clock className="h-3 w-3" /> {shop?.verificationStatus ?? "Not started"}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {shop?.verified ? (
              <p className="text-sm text-muted-foreground">
                Your storefront is verified and visible across marketplace search.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Unverified shops are hidden from search results. Complete verification to be listed.
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={`/${locale}/seller/shop`}>Complete verification</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl shadow-xs">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-primary" />
              Subscription
            </CardTitle>
            {activePackage?.name ? (
              <Badge variant="info" className="rounded-full">
                {activePackage.name}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full">
                None
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {subscription?.subscription?.expiresAt ? (
              <p className="text-sm text-muted-foreground">
                Expires {new Date(subscription.subscription.expiresAt).toLocaleDateString()} ·{" "}
                <span className="font-semibold text-foreground">
                  {subscription.remaining ?? "unlimited"}
                </span>{" "}
                product slots left
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Buy a package to raise your product limit and unlock seller perks.
              </p>
            )}
            <Button asChild size="sm" variant="outline" className="rounded-xl">
              <Link href={`/${locale}/seller/package`}>Manage package</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available balance"
          value={formatPrice(summary?.available ?? 0)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Products"
          value={products?.length ?? 0}
          hint={pendingProducts > 0 ? `${pendingProducts} awaiting approval` : undefined}
          icon={Package}
          tone="primary"
        />
        <StatCard
          label="Orders"
          value={orders?.length ?? 0}
          hint={openOrders > 0 ? `${openOrders} still open` : undefined}
          icon={ShoppingBag}
          tone="info"
        />
        <StatCard
          label="Withdrawn"
          value={formatPrice(summary?.withdrawn ?? 0)}
          icon={ArrowDownToLine}
          tone="default"
        />
      </div>

      <Card className="overflow-hidden rounded-3xl shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base font-bold">Sales — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-5">
          {salesSeries.every((point) => point.total === 0) ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No sales recorded in the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sellerSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Area
                  type="monotone"
                  dataKey="total"
                  strokeWidth={2.5}
                  stroke="hsl(var(--primary))"
                  fill="url(#sellerSalesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
