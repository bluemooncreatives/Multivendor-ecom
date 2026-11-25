import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info" | "destructive";
  className?: string;
  trend?: { value: number; label?: string };
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; text: string }> = {
  default: { bg: "bg-secondary", text: "text-secondary-foreground" },
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  info: { bg: "bg-info/10", text: "text-info" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
};

/** KPI metric card shared across Customer, Seller, and Admin overview screens. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
  trend,
}: StatCardProps) {
  const { bg, text } = TONE_CLASSES[tone];

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="truncate text-3xl font-black tracking-tight">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            {trend && (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "→"}
                {Math.abs(trend.value)}%
                {trend.label && <span className="font-normal text-muted-foreground">{trend.label}</span>}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                bg,
                text,
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
