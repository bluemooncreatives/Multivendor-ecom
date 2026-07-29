"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const locale = useLocale();

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <CheckoutSteps current={6} />

      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-10 text-center shadow-sm">
        <CheckCircle2 className="h-16 w-16 text-primary" />
        <h1 className="text-2xl font-bold">Thank You!</h1>
        <p className="text-muted-foreground">Your order has been placed successfully.</p>
        {code && (
          <p className="border-t pt-4 text-muted-foreground">
            Order code: <span className="font-mono font-semibold text-foreground">{code}</span>
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/products`}>Continue Shopping</Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/orders`}>View My Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
