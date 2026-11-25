"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FlashDeal } from "@/lib/hooks/useStorefront";

/** Live countdown to a campaign's end, ticking once per second. */
export function CountdownTimer({ endsAt, inverted = false }: { endsAt: string; inverted?: boolean }) {
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining <= 0) return <Badge variant="destructive">Ended</Badge>;

  const totalSeconds = Math.floor(remaining / 1000);
  const parts = [
    { value: Math.floor(totalSeconds / 86400), label: "d" },
    { value: Math.floor((totalSeconds % 86400) / 3600), label: "h" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "m" },
    { value: totalSeconds % 60, label: "s" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-medium ${inverted ? "text-destructive-foreground/80" : "text-muted-foreground"}`}>
        Ends in
      </span>
      {parts.map((part) => (
        <span
          key={part.label}
          className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${
            inverted ? "bg-background/20 text-destructive-foreground backdrop-blur" : "bg-primary text-primary-foreground"
          }`}
        >
          {String(part.value).padStart(2, "0")}
          {part.label}
        </span>
      ))}
    </div>
  );
}

export function FlashDealBanner({ deal, locale }: { deal: FlashDeal; locale: string }) {
  return (
    <Link
      href={`/${locale}/flash-deal/${deal.slug}`}
      className="group flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-destructive via-destructive/90 to-primary p-4 text-destructive-foreground shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold">{deal.title}</p>
          <p className="text-xs opacity-90">
            {deal.products.length} deal{deal.products.length === 1 ? "" : "s"} · ends{" "}
            {new Date(deal.endsAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block">
          <CountdownTimer endsAt={deal.endsAt} inverted />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-transform group-hover:translate-x-0.5">
          Shop the deals
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
