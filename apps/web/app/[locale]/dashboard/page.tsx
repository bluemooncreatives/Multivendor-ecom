"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { MailCheck, ShoppingBag, Wallet, ArrowRight, Package, Star, Bell } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useWallet } from "@/lib/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/format";

export default function DashboardOverviewPage() {
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const { data: orders } = useMyOrders();
  const { data: wallet } = useWallet();

  const recentOrders = (orders ?? []).slice(0, 5);
  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 rounded-full bg-black/10 blur-xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-white/30">
              <AvatarFallback className="bg-white/20 text-xl font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white/70">Welcome back,</p>
              <h1 className="text-2xl font-black">{user?.name ?? "Account"}</h1>
              <p className="text-sm text-white/70">{user?.email ?? user?.phone}</p>
            </div>
          </div>
          <Button
            asChild
            variant="secondary"
            className="shrink-0 rounded-xl font-bold"
          >
            <Link href={`/${locale}/products`}>
              Continue Shopping
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total orders"
          value={orders?.length ?? 0}
          icon={ShoppingBag}
          tone="primary"
          hint="All time orders"
        />
        <StatCard
          label="Wallet balance"
          value={formatPrice(wallet?.balance ?? 0, wallet?.currency)}
          icon={Wallet}
          tone="success"
          hint="Available to spend"
        />
        <StatCard
          label="Email verified"
          value={user?.emailVerifiedAt ? "Verified" : "Pending"}
          icon={MailCheck}
          tone={user?.emailVerifiedAt ? "success" : "warning"}
          hint={user?.emailVerifiedAt ? "Account is verified" : "Check your email"}
        />
      </div>

      {/* Recent orders */}
      <Card className="overflow-hidden rounded-3xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-bold">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" asChild className="rounded-xl">
            <Link href={`/${locale}/dashboard/orders`}>View all →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="Start shopping to see your orders here."
              action={
                <Button asChild size="sm" className="rounded-xl">
                  <Link href={`/${locale}/products`}>Shop Now</Link>
                </Button>
              }
              size="sm"
              className="m-4 border-dashed"
            />
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-0.5">
                    <p className="font-mono text-sm font-black">{order.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-black">
                      {formatPrice(order.grandTotal, order.currency)}
                    </span>
                    <Button variant="ghost" size="sm" asChild className="h-7 rounded-lg px-2">
                      <Link href={`/${locale}/dashboard/orders`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { href: `/${locale}/wishlist`, label: "My Wishlist", icon: Star, desc: "Saved products" },
          { href: `/${locale}/dashboard/wallet`, label: "My Wallet", icon: Wallet, desc: "View balance & history" },
          { href: `/${locale}/dashboard/conversations`, label: "Messages", icon: Bell, desc: "Seller conversations" },
          { href: `/${locale}/dashboard/profile`, label: "Profile Settings", icon: MailCheck, desc: "Update your info" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ArrowRight className="ms-auto h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
