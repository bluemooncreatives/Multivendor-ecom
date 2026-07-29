"use client";

import { RequireAuth } from "@/components/shared/require-auth";
import { DashboardNav } from "@/components/shared/dashboard-nav";

const LINKS = [
  { href: "", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/refunds", label: "Refunds" },
  { href: "/wallet", label: "Wallet" },
  { href: "/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/downloads", label: "Downloads" },
  { href: "/conversations", label: "Messages" },
  { href: "/tickets", label: "Support" },
  { href: "/classifieds", label: "Classifieds" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/club-points", label: "Club points" },
  { href: "/profile", label: "Profile" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="container grid gap-8 py-10 md:grid-cols-[220px_1fr]">
        <aside>
          <DashboardNav basePath="/dashboard" links={LINKS} />
        </aside>
        <div>{children}</div>
      </div>
    </RequireAuth>
  );
}
