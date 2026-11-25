import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorefrontSectionProps {
  title: string;
  href?: string;
  hrefLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  variant?: "default" | "flush";
}

/** Unified section header + card wrapper for storefront product/category strips. */
export function StorefrontSection({
  title,
  href,
  hrefLabel = "View All",
  icon,
  children,
  className,
  noPad = false,
  variant = "default",
}: StorefrontSectionProps) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card shadow-xs", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-muted/50 to-transparent px-5 py-4 md:px-6">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h2 className="text-base font-bold tracking-tight sm:text-lg">{title}</h2>
        </div>

        {href && (
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-primary transition-all hover:gap-2"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className={cn(noPad ? "" : "p-4 md:p-6")}>{children}</div>
    </section>
  );
}
