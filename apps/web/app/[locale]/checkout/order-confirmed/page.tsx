"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const locale = useLocale();

  return (
    <div className="container flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-600" />
      <h1 className="text-2xl font-bold">Order placed!</h1>
      {code && (
        <p className="text-muted-foreground">
          Your order code is <span className="font-mono font-semibold text-foreground">{code}</span>
        </p>
      )}
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href={`/${locale}/products`}>Continue shopping</Link>
        </Button>
        <Button asChild>
          <Link href={`/${locale}/dashboard/orders`}>View my orders</Link>
        </Button>
      </div>
    </div>
  );
}
