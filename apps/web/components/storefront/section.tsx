import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorefrontSectionProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  href?: string;
  hrefLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  /** "default" = open editorial section · "card" = bordered surface */
  variant?: "default" | "card";
}

/** Unified section header + wrapper for storefront product/category strips. */
export function StorefrontSection({
  title,
  subtitle,
  eyebrow,
  href,
  hrefLabel = "View all",
  icon,
  children,
  className,
  noPad = false,
  variant = "default",
}: StorefrontSectionProps) {
  const header = (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-1.5">
        {eyebrow && <span className="eyebrow">{icon}{eyebrow}</span>}
        <h2 className="text-display text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-[0.95] text-foreground">
          {title}
        </h2>
        {subtitle && <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[13px] font-semibold transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
        >
          {hrefLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
        </Link>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <section className={cn("overflow-hidden rounded-3xl border bg-card p-6 shadow-xs md:p-8", className)}>
        {header}
        <div className={cn(noPad && "-mx-6 md:-mx-8")}>{children}</div>
      </section>
    );
  }

  return (
    <section className={cn(className)}>
      {header}
      {children}
    </section>
  );
}
