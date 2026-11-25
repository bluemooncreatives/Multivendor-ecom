"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Store, Wallet, PackageCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BENEFITS = [
  { icon: Store, title: "Open Your Own Shop", body: "Get a dedicated storefront to showcase and sell your products." },
  { icon: PackageCheck, title: "Manage Orders Easily", body: "Track, fulfill, and update orders from a single seller dashboard." },
  { icon: Wallet, title: "Fast Withdrawals", body: "Request withdrawals directly from your seller ledger balance." },
];

export default function BecomeSellerPage() {
  const locale = useLocale();

  return (
    <div className="container max-w-4xl space-y-10 py-12">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Become a Seller</h1>
        <p className="text-base text-muted-foreground">
          Join our marketplace and start selling to thousands of customers with dedicated storefronts and fast payouts.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href={`/${locale}/register?role=seller`}>
            Start Selling
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} className="transition-shadow hover:shadow-md">
            <CardContent className="space-y-3 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{benefit.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
