"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { MailCheck, ShoppingBag, Wallet, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useWallet } from "@/lib/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/lib/format";

export default function DashboardOverviewPage() {
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useMyOrders();
  const { data: wallet } = useWallet();

  const recentOrders = (orders ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${user ? `, ${user.name}` : ""}`}
        description="Track your orders, manage wallet balance, and update account details."
        actions={
          <Button asChild size="sm">
            <Link href={`/${locale}/products`}>
              Continue Shopping
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={orders?.length ?? 0} icon={ShoppingBag} tone="primary" />
        <StatCard
          label="Wallet balance"
          value={formatPrice(wallet?.balance ?? 0, wallet?.currency)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Email verified"
          value={user?.emailVerifiedAt ? "Yes" : "No"}
          icon={MailCheck}
          tone={user?.emailVerifiedAt ? "success" : "warning"}
        />
      </div>

      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-4">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard/orders`}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-sm">
                <div>
                  <p className="font-mono font-semibold">{order.code}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-semibold">{formatPrice(order.grandTotal, order.currency)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
