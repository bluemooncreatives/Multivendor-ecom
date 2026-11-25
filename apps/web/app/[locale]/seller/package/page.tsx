"use client";

import toast from "react-hot-toast";
import { Check, Crown } from "lucide-react";
import { useSellerPackages, useMySellerSubscription, usePurchasePackage } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

export default function SellerPackagePage() {
  const { data: packages } = useSellerPackages();
  const { data: subscription } = useMySellerSubscription();
  const purchase = usePurchasePackage("seller");

  async function buy(packageId: string, paymentMethod: "wallet" | "manual") {
    try {
      await purchase.mutateAsync({ packageId, paymentMethod });
      toast.success(
        paymentMethod === "wallet" ? "Package activated" : "Payment recorded — an admin will confirm it shortly",
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not complete the purchase"));
    }
  }

  const current = subscription?.subscription;

  return (
    <div className="space-y-6">
      <PageHeader title="Your package" description="Manage your seller subscription plan and product upload allowance." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-primary" />
            Current plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-sm">
          {current ? (
            <>
              <p className="text-lg font-bold">{current.packageId?.name ?? "Active package"}</p>
              {subscription.expiresAt && (
                <p className="text-muted-foreground">
                  {subscription.expired ? "Expired on" : "Valid until"}{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </p>
              )}
              <p>
                {subscription.remainingUploads} product upload(s) and {subscription.remainingDigitalUploads} digital
                upload(s) remaining · {subscription.productCount} listed so far
              </p>
              {subscription.expired && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Your package has expired, so your listings are unpublished. Renew below to publish them again.
                  </AlertDescription>
                </Alert>
              )}
              {!subscription.expired && subscription.remainingUploads === 0 && (
                <Alert variant="warning">
                  <AlertDescription>
                    You have used every upload in your plan. Buy a package below to add more products.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">You do not have an active package. Choose one below to start listing.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        {packages?.map(
          (pkg: {
            id: string;
            name: string;
            price: number;
            durationDays: number;
            productLimit: number;
            digitalProductLimit?: number;
            commissionRateOverride: number | null;
          }) => (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center justify-between text-base">
                  {pkg.name}
                  {current?.packageId?.id === pkg.id && <Badge>Current</Badge>}
                </CardTitle>
                <p className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-5 text-sm">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {pkg.durationDays} days
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {pkg.productLimit} product upload(s)
                  </li>
                  {!!pkg.digitalProductLimit && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {pkg.digitalProductLimit} digital upload(s)
                    </li>
                  )}
                  {pkg.commissionRateOverride !== null && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {pkg.commissionRateOverride}% commission rate
                    </li>
                  )}
                </ul>
                <div className="flex flex-col gap-2">
                  <Button disabled={purchase.isPending} onClick={() => buy(pkg.id, "wallet")}>
                    Pay from wallet
                  </Button>
                  <Button variant="outline" disabled={purchase.isPending} onClick={() => buy(pkg.id, "manual")}>
                    Pay offline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}
