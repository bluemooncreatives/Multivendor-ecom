"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Store, Wallet, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  { icon: Store, title: "Open Your Own Shop", body: "Get a dedicated storefront to showcase and sell your products." },
  { icon: PackageCheck, title: "Manage Orders Easily", body: "Track, fulfill, and update orders from a single seller dashboard." },
  { icon: Wallet, title: "Fast Withdrawals", body: "Request withdrawals directly from your seller ledger balance." },
];

export default function BecomeSellerPage() {
  const locale = useLocale();

  return (
    <div className="container max-w-3xl space-y-8 py-10 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Become a Seller</h1>
        <p className="text-muted-foreground">
          Join our marketplace and start selling to thousands of customers.
        </p>
        <Button asChild size="lg">
          <Link href={`/${locale}/register?role=seller`}>Start Selling</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="rounded-lg bg-card p-5 text-left shadow-sm">
            <benefit.icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="font-semibold">{benefit.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{benefit.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
