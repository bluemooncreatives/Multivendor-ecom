"use client";

import { useAdminAddons, useToggleAddon } from "@/lib/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CardGridSkeleton } from "@/components/shared/loading-state";

const LABELS: Record<string, string> = {
  affiliate: "Affiliate program",
  pos: "Point of sale",
  seller_subscription: "Seller subscription packages",
  club_points: "Club points",
  classified_products: "Classified products",
  manual_payment: "Manual / offline payment",
  otp: "Phone OTP verification",
  refunds: "Refund requests",
};

export default function AdminAddonsPage() {
  const { data: addons, isLoading } = useAdminAddons();
  const toggleAddon = useToggleAddon();

  return (
    <div className="space-y-6">
      <PageHeader title="Add-ons" description="Enable or disable optional marketplace modules." />

      {isLoading ? (
        <CardGridSkeleton count={8} columns="sm:grid-cols-2" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(LABELS).map((key) => {
            const addon = addons?.find((a: { key: string; enabled: boolean }) => a.key === key);
            const enabled = Boolean(addon?.enabled);
            return (
              <Card key={key}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="space-y-1.5">
                    <p className="font-semibold">{LABELS[key]}</p>
                    <StatusBadge status={enabled ? "enabled" : "disabled"} />
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(next) => toggleAddon.mutate({ key, enabled: next })}
                    aria-label={`Toggle ${LABELS[key]}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
