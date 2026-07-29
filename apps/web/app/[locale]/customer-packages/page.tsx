"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import { useCustomerPackages, usePurchaseCustomerPackage } from "@/lib/hooks/useStorefront";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CustomerPackagesPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: packages, isLoading } = useCustomerPackages();
  const purchase = usePurchaseCustomerPackage();
  const { display } = useDisplayCurrency();
  const isSignedIn = useAuthStore((s) => Boolean(s.accessToken));

  async function handlePurchase(packageId: string) {
    if (!isSignedIn) {
      router.push(`/${locale}/login`);
      return;
    }
    try {
      await purchase.mutateAsync({ packageId, paymentMethod: "wallet" });
      toast.success("Package purchased — your listing allowance has been topped up");
      router.push(`/${locale}/dashboard/classifieds`);
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string } } })?.response;
      toast.error(response?.data?.message ?? "Could not purchase that package");
    }
  }

  return (
    <div className="container space-y-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Listing packages</h1>
        <p className="text-sm text-muted-foreground">
          Buy an allowance to post your own items in the classifieds section.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading…</p>
      ) : !packages || packages.length === 0 ? (
        <p className="text-center text-muted-foreground">No packages are on sale right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages
            .filter((pkg) => pkg.active)
            .map((pkg) => (
              <Card key={pkg.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary">{display(pkg.price, pkg.currency)}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {pkg.productUploadLimit} listing{pkg.productUploadLimit === 1 ? "" : "s"}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Valid for {pkg.durationDays} days
                    </li>
                  </ul>
                  <Button onClick={() => handlePurchase(pkg.id)} disabled={purchase.isPending}>
                    {isSignedIn ? "Buy with wallet credit" : "Sign in to buy"}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
