import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StorefrontSection({
  title,
  href,
  hrefLabel = "View More",
  icon,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/20 px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6">{children}</CardContent>
    </Card>
  );
}
