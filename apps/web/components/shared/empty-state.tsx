import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/** Consistent empty-state placeholder with icon, message, and optional CTA. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "py-8 px-4",
    md: "py-14 px-6",
    lg: "py-20 px-8",
  };

  const iconSizes = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  const iconInnerSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 text-center",
        sizeClasses[size],
        className,
      )}
    >
      <div
        className={cn(
          "mb-5 flex items-center justify-center rounded-3xl bg-muted/60 text-muted-foreground/60",
          iconSizes[size],
        )}
      >
        <Icon className={iconInnerSizes[size]} />
      </div>
      <h3 className={cn("font-bold text-foreground", size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base")}>
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
