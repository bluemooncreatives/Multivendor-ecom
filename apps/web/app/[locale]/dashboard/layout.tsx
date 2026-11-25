"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  Wallet,
  MapPin,
  Heart,
  Download,
  MessageSquare,
  LifeBuoy,
  Tag,
  Share2,
  Coins,
  User,
} from "lucide-react";
import { RequireAuth } from "@/components/shared/require-auth";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavLinkItem } from "@/components/shared/dashboard-nav";

const LINKS: NavLinkItem[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, group: "Account" },
  { href: "/orders", label: "Orders", icon: ShoppingBag, group: "Account" },
  { href: "/refunds", label: "Refunds", icon: RotateCcw, group: "Account" },
  { href: "/downloads", label: "Downloads", icon: Download, group: "Account" },
  { href: "/wishlist", label: "Wishlist", icon: Heart, group: "Account" },
  { href: "/wallet", label: "Wallet", icon: Wallet, group: "Finance & Rewards" },
  { href: "/club-points", label: "Club points", icon: Coins, group: "Finance & Rewards" },
  { href: "/affiliate", label: "Affiliate", icon: Share2, group: "Finance & Rewards" },
  { href: "/classifieds", label: "Classifieds", icon: Tag, group: "Community" },
  { href: "/conversations", label: "Messages", icon: MessageSquare, group: "Community" },
  { href: "/tickets", label: "Support", icon: LifeBuoy, group: "Community" },
  { href: "/addresses", label: "Addresses", icon: MapPin, group: "Settings" },
  { href: "/profile", label: "Profile", icon: User, group: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PortalShell title="Customer Dashboard" basePath="/dashboard" links={LINKS}>
        {children}
      </PortalShell>
    </RequireAuth>
  );
}
