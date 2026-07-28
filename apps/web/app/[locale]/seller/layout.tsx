"use client";

import { RequireAuth } from "@/components/shared/require-auth";
import { DashboardNav } from "@/components/shared/dashboard-nav";

const LINKS = [
  { href: "", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/orders", label: "Orders" },
  { href: "/pos", label: "POS" },
  { href: "/ledger", label: "Ledger" },
  { href: "/withdrawals", label: "Withdrawals" },
  { href: "/shop", label: "Shop settings" },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["seller"]}>
      <div className="container grid gap-8 py-10 md:grid-cols-[220px_1fr]">
        <aside>
          <DashboardNav basePath="/seller" links={LINKS} />
        </aside>
        <div>{children}</div>
      </div>
    </RequireAuth>
  );
}
