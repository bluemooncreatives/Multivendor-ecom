import Link from "next/link";
import type { ReactNode } from "react";

export function StorefrontSection({
  title,
  href,
  hrefLabel = "View More",
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg bg-card p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-primary hover:underline">
            {hrefLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
