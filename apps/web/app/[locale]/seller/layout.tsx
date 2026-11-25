"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MonitorSmartphone,
  Star,
  MessageSquare,
  RotateCcw,
  BookOpen,
  Banknote,
  Crown,
  Store,
} from "lucide-react";
import { RequireAuth } from "@/components/shared/require-auth";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavLinkItem } from "@/components/shared/dashboard-nav";

const LINKS: NavLinkItem[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, group: "Store" },
  { href: "/products", label: "Products", icon: Package, group: "Store" },
  { href: "/orders", label: "Orders", icon: ShoppingBag, group: "Store" },
  { href: "/pos", label: "POS", icon: MonitorSmartphone, group: "Store" },
  { href: "/reviews", label: "Reviews", icon: Star, group: "Customers" },
  { href: "/conversations", label: "Messages", icon: MessageSquare, group: "Customers" },
  { href: "/refunds", label: "Refund requests", icon: RotateCcw, group: "Customers" },
  { href: "/ledger", label: "Ledger", icon: BookOpen, group: "Finance" },
  { href: "/withdrawals", label: "Withdrawals", icon: Banknote, group: "Finance" },
  { href: "/package", label: "Your package", icon: Crown, group: "Settings" },
  { href: "/shop", label: "Shop settings", icon: Store, group: "Settings" },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["seller"]}>
      <PortalShell title="Seller Portal" basePath="/seller" links={LINKS}>
        {children}
      </PortalShell>
    </RequireAuth>
  );
}
