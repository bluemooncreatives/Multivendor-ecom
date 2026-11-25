"use client";

import {
  LayoutDashboard,
  Users,
  Store,
  UserCog,
  FolderTree,
  Package,
  Palette,
  Ticket,
  Zap,
  ShoppingBag,
  RotateCcw,
  Banknote,
  Wallet,
  Crown,
  Share2,
  Coins,
  Star,
  LifeBuoy,
  MessageSquare,
  BarChart3,
  FileSpreadsheet,
  LayoutTemplate,
  FileText,
  ScrollText,
  Link2,
  Globe,
  MapPin,
  Mail,
  MessageCircleCode,
  CreditCard,
  Puzzle,
  Settings,
  MonitorSmartphone,
} from "lucide-react";
import { RequireAuth } from "@/components/shared/require-auth";
import { PortalShell } from "@/components/shared/portal-shell";
import type { NavLinkItem } from "@/components/shared/dashboard-nav";

const LINKS: NavLinkItem[] = [
  { href: "", label: "Overview", icon: LayoutDashboard, group: "Overview" },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "Overview" },
  { href: "/pos", label: "Point of sale", icon: MonitorSmartphone, group: "Overview" },
  { href: "/users", label: "Customers", icon: Users, group: "People" },
  { href: "/sellers", label: "Sellers", icon: Store, group: "People" },
  { href: "/staff", label: "Staff & roles", icon: UserCog, group: "People" },
  { href: "/taxonomy", label: "Categories & brands", icon: FolderTree, group: "Catalog" },
  { href: "/products", label: "Product moderation", icon: Package, group: "Catalog" },
  { href: "/attributes", label: "Attributes & colors", icon: Palette, group: "Catalog" },
  { href: "/bulk-tools", label: "Bulk import & export", icon: FileSpreadsheet, group: "Catalog" },
  { href: "/coupons", label: "Coupons", icon: Ticket, group: "Promotions" },
  { href: "/flash-deals", label: "Flash deals", icon: Zap, group: "Promotions" },
  { href: "/affiliate", label: "Affiliate program", icon: Share2, group: "Promotions" },
  { href: "/club-points", label: "Club points", icon: Coins, group: "Promotions" },
  { href: "/orders", label: "Orders", icon: ShoppingBag, group: "Commerce" },
  { href: "/refunds", label: "Refund requests", icon: RotateCcw, group: "Commerce" },
  { href: "/withdrawals", label: "Withdrawals", icon: Banknote, group: "Commerce" },
  { href: "/wallet-recharges", label: "Wallet recharges", icon: Wallet, group: "Commerce" },
  { href: "/packages", label: "Subscription packages", icon: Crown, group: "Commerce" },
  { href: "/pickup-points", label: "Pickup points", icon: MapPin, group: "Commerce" },
  { href: "/reviews", label: "Reviews", icon: Star, group: "Support & Content" },
  { href: "/tickets", label: "Support tickets", icon: LifeBuoy, group: "Support & Content" },
  { href: "/conversations", label: "Conversations", icon: MessageSquare, group: "Support & Content" },
  { href: "/homepage", label: "Homepage builder", icon: LayoutTemplate, group: "CMS & Storefront" },
  { href: "/pages", label: "CMS pages", icon: FileText, group: "CMS & Storefront" },
  { href: "/policies", label: "Policies", icon: ScrollText, group: "CMS & Storefront" },
  { href: "/links", label: "Header & footer links", icon: Link2, group: "CMS & Storefront" },
  { href: "/newsletter", label: "Newsletter", icon: Mail, group: "CMS & Storefront" },
  { href: "/localization", label: "Currencies & languages", icon: Globe, group: "System" },
  { href: "/sms", label: "SMS & OTP", icon: MessageCircleCode, group: "System" },
  { href: "/payment-gateways", label: "Payment gateways", icon: CreditCard, group: "System" },
  { href: "/addons", label: "Add-ons", icon: Puzzle, group: "System" },
  { href: "/settings", label: "Settings", icon: Settings, group: "System" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["admin", "staff"]}>
      <PortalShell title="Admin Console" basePath="/admin" links={LINKS}>
        {children}
      </PortalShell>
    </RequireAuth>
  );
}
