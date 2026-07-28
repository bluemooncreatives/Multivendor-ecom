"use client";

import { RequireAuth } from "@/components/shared/require-auth";
import { DashboardNav } from "@/components/shared/dashboard-nav";

const LINKS = [
  { href: "", label: "Overview" },
  { href: "/users", label: "Customers" },
  { href: "/sellers", label: "Sellers" },
  { href: "/products", label: "Product moderation" },
  { href: "/orders", label: "Orders" },
  { href: "/withdrawals", label: "Withdrawals" },
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
