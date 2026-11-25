"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Clock } from "lucide-react";
import type { FlashDeal } from "@/lib/hooks/useStorefront";

/** Live countdown to a campaign's end, ticking once per second. */
export function CountdownTimer({
  endsAt,
  inverted = false,
}: {
  endsAt: string;
  inverted?: boolean;
}) {
  const [remaining, setRemaining] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining(new Date(endsAt).getTime() - Date.now()),
      1000,
    );
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining <= 0) {
    return (
      <span className="rounded-xl bg-background/20 px-3 py-1 text-xs font-bold">Ended</span>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const parts = [
    { value: Math.floor(totalSeconds / 86400), label: "d" },
    { value: Math.floor((totalSeconds % 86400) / 3600), label: "h" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "m" },
    { value: totalSeconds % 60, label: "s" },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <Clock className={`h-3.5 w-3.5 ${inverted ? "text-white/70" : "text-muted-foreground"}`} />
      {parts.map((part, i) => (
        <span key={part.label} className="flex items-center gap-1">
          <span
            className={`min-w-[28px] rounded-lg px-1.5 py-1 text-center font-mono text-sm font-black tabular-nums ${
              inverted
                ? "bg-black/20 text-white backdrop-blur-sm"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {String(part.value).padStart(2, "0")}
          </span>
          <span
            className={`text-[10px] font-bold ${inverted ? "text-white/60" : "text-muted-foreground"}`}
          >
            {part.label}
          </span>
          {i < parts.length - 1 && (
            <span className={`text-xs font-bold ${inverted ? "text-white/50" : "text-muted-foreground/50"}`}>
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function FlashDealBanner({
  deal,
  locale,
}: {
  deal: FlashDeal;
  locale: string;
}) {
  return (
    <Link
      href={`/${locale}/flash-deal/${deal.slug}`}
      className="group relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-destructive via-red-600 to-primary p-5 text-white shadow-lg transition-all hover:shadow-xl sm:p-6"
    >
      {/* Background deco */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-black/10 blur-xl" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Zap className="h-6 w-6 animate-bounce" />
        </div>
        <div>
          <p className="text-lg font-black">{deal.title}</p>
          <p className="text-sm text-white/80">
            {deal.products.length} deal{deal.products.length !== 1 ? "s" : ""} · ends{" "}
            {new Date(deal.endsAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-5">
        <div className="hidden sm:block">
          <CountdownTimer endsAt={deal.endsAt} inverted />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-background/95 px-4 py-2 text-sm font-bold text-foreground shadow-sm transition-all group-hover:gap-2">
          Shop Deals
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
