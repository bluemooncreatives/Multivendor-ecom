"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ShoppingBag,
  DollarSign,
  Store,
  Banknote,
  ArrowRight,
  Package,
  Settings,
} from "lucide-react";
import { useAdminDashboard } from "@/lib/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { formatPrice } from "@/lib/format";

const QUICK_LINKS = [
  { href: "/orders", label: "Manage orders", desc: "Review & fulfill", icon: ShoppingBag },
  { href: "/products", label: "Moderate products", desc: "Approve listings", icon: Package },
  { href: "/sellers", label: "Verify sellers", desc: "KYC & storefronts", icon: Store },
  { href: "/settings", label: "Platform settings", desc: "Site configuration", icon: Settings },
];

export default function AdminOverviewPage() {
  const locale = useLocale();
  const { data } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor platform revenue, seller activity, orders, and pending payouts."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total orders"
          value={data?.totalOrders ?? 0}
          icon={ShoppingBag}
          tone="primary"
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(data?.totalRevenue ?? 0)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard label="Sellers" value={data?.sellerCount ?? 0} icon={Store} tone="info" />
        <StatCard
          label="Pending withdrawals"
          value={data?.pendingWithdrawals ?? 0}
          icon={Banknote}
          tone="warning"
        />
      </div>

      <Card className="overflow-hidden rounded-3xl shadow-xs">
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={`/${locale}/admin${href}`}
              className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
