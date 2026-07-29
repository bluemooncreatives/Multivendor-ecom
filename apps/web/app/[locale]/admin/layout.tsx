"use client";

import { RequireAuth } from "@/components/shared/require-auth";
import { DashboardNav } from "@/components/shared/dashboard-nav";

const LINKS = [
  { href: "", label: "Overview" },
  { href: "/users", label: "Customers" },
  { href: "/sellers", label: "Sellers" },
  { href: "/staff", label: "Staff & roles" },
  { href: "/taxonomy", label: "Categories & brands" },
  { href: "/products", label: "Product moderation" },
  { href: "/attributes", label: "Attributes & colors" },
  { href: "/coupons", label: "Coupons" },
  { href: "/flash-deals", label: "Flash deals" },
  { href: "/orders", label: "Orders" },
  { href: "/refunds", label: "Refund requests" },
  { href: "/withdrawals", label: "Withdrawals" },
  { href: "/wallet-recharges", label: "Wallet recharges" },
  { href: "/packages", label: "Subscription packages" },
  { href: "/affiliate", label: "Affiliate program" },
  { href: "/club-points", label: "Club points" },
  { href: "/reviews", label: "Reviews" },
  { href: "/tickets", label: "Support tickets" },
  { href: "/conversations", label: "Conversations" },
  { href: "/reports", label: "Reports" },
  { href: "/bulk-tools", label: "Bulk import & export" },
  { href: "/homepage", label: "Homepage builder" },
  { href: "/pages", label: "CMS pages" },
  { href: "/policies", label: "Policies" },
  { href: "/links", label: "Header & footer links" },
  { href: "/localization", label: "Currencies & languages" },
  { href: "/pickup-points", label: "Pickup points" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/sms", label: "SMS & OTP" },
  { href: "/payment-gateways", label: "Payment gateways" },
  { href: "/addons", label: "Add-ons" },
  { href: "/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["admin", "staff"]}>
      <div className="container grid gap-8 py-10 md:grid-cols-[220px_1fr]">
        <aside>
          <DashboardNav basePath="/admin" links={LINKS} />
        </aside>
        <div>{children}</div>
      </div>
    </RequireAuth>
  );
}
