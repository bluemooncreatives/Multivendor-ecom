"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, ArrowRight, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const locale = useLocale();

  return (
    <div className="container max-w-2xl space-y-6 py-8 lg:py-12">
      <CheckoutSteps current={6} />

      <Card className="overflow-hidden rounded-3xl border shadow-xl">
        <div className="h-2 bg-gradient-to-r from-success via-emerald-400 to-primary" />
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center sm:p-12">
          <div className="relative flex h-20 w-20 animate-bounce-in items-center justify-center rounded-3xl bg-success/15 text-success">
            <CheckCircle2 className="h-11 w-11" />
            <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Thank You!</h1>
            <p className="text-base text-muted-foreground">
              Your order has been placed successfully and is being prepared.
            </p>
          </div>

          {code && (
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
              <Package className="h-4 w-4 text-primary" />
              Order code:{" "}
              <span className="font-mono text-base font-black text-foreground">{code}</span>
            </div>
          )}

          <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" size="lg" className="rounded-2xl">
              <Link href={`/${locale}/products`}>Continue Shopping</Link>
            </Button>
            <Button asChild size="lg" className="rounded-2xl font-bold shadow-colored shadow-sm">
              <Link href={`/${locale}/dashboard/orders`}>
                View My Orders
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
