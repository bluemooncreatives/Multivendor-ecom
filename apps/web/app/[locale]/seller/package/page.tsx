"use client";

import toast from "react-hot-toast";
import { useSellerPackages, useMySellerSubscription, usePurchasePackage } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message ?? "Could not complete the purchase");
    }
  }

  const current = subscription?.subscription;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your package</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {current ? (
            <>
              <p className="text-lg font-semibold">{current.packageId?.name ?? "Active package"}</p>
              {subscription.expiresAt && (
                <p className="text-muted-foreground">
                  {subscription.expired ? "Expired on" : "Valid until"}{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </p>
              )}
              {/* Uploads are an allowance consumed per listing, so this is a
                  remaining count, not a live product count minus a limit. */}
              <p>
                {subscription.remainingUploads} product upload(s) and {subscription.remainingDigitalUploads} digital
                upload(s) remaining · {subscription.productCount} listed so far
              </p>
              {subscription.expired && (
                <p className="text-destructive">
                  Your package has expired, so your listings are unpublished. Renew below to publish them again.
                </p>
              )}
              {!subscription.expired && subscription.remainingUploads === 0 && (
                <p className="text-destructive">
                  You have used every upload in your plan. Buy a package below to add more products.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">You do not have an active package. Choose one below to start listing.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {packages?.map(
          (pkg: { id: string; name: string; price: number; durationDays: number; productLimit: number; digitalProductLimit?: number; commissionRateOverride: number | null }) => (
            <Card key={pkg.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {pkg.name}
                  {current?.packageId?.id === pkg.id && <Badge>Current</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-2xl font-bold">{formatPrice(pkg.price)}</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>{pkg.durationDays} days</li>
                  <li>{pkg.productLimit} product upload(s)</li>
                  {!!pkg.digitalProductLimit && <li>{pkg.digitalProductLimit} digital upload(s)</li>}
                  {pkg.commissionRateOverride !== null && <li>{pkg.commissionRateOverride}% commission rate</li>}
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
