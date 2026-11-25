"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const locale = useLocale();

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <CheckoutSteps current={6} />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Thank You!</h1>
          <p className="text-muted-foreground">Your order has been placed successfully.</p>
          {code && (
            <div className="rounded-lg border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
              Order code: <span className="font-mono font-semibold text-foreground">{code}</span>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/products`}>Continue Shopping</Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/dashboard/orders`}>View My Orders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
