"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ShoppingBag, DollarSign, Store, Banknote, ArrowRight } from "lucide-react";
import { useAdminDashboard } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { formatPrice } from "@/lib/format";

const QUICK_LINKS = [
  { href: "/orders", label: "Manage orders" },
  { href: "/products", label: "Moderate products" },
  { href: "/sellers", label: "Verify sellers" },
  { href: "/settings", label: "Platform settings" },
];

export default function AdminOverviewPage() {
  const locale = useLocale();
  const { data } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Monitor platform revenue, seller activity, orders, and pending payouts."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={data?.totalOrders ?? 0} icon={ShoppingBag} tone="primary" />
        <StatCard label="Total revenue" value={formatPrice(data?.totalRevenue ?? 0)} icon={DollarSign} tone="success" />
        <StatCard label="Sellers" value={data?.sellerCount ?? 0} icon={Store} tone="default" />
        <StatCard label="Pending withdrawals" value={data?.pendingWithdrawals ?? 0} icon={Banknote} tone="warning" />
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <Button key={item.href} variant="outline" asChild className="justify-between">
              <Link href={`/${locale}/admin${item.href}`}>
                {item.label}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
