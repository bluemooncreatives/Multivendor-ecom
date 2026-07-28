"use client";

import { useAdminAddons, useToggleAddon } from "@/lib/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add-ons</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(LABELS).map((key) => {
            const addon = addons?.find((a: any) => a.key === key);
            return (
              <Card key={key}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-medium">{LABELS[key]}</p>
                    <Badge variant={addon?.enabled ? "secondary" : "outline"}>
                      {addon?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAddon.mutate({ key, enabled: !addon?.enabled })}
                  >
                    {addon?.enabled ? "Disable" : "Enable"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
