import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT_MAP: Record<string, BadgeProps["variant"]> = {
  delivered: "success",
  paid: "success",
  approved: "success",
  verified: "success",
  active: "success",
  enabled: "success",
  live: "success",
  published: "success",
  visible: "success",
  sent: "success",
  confirmed: "info",
  processing: "info",
  shipped: "info",
  answered: "info",
  open: "info",
  pending: "warning",
  unpaid: "warning",
  review: "warning",
  draft: "outline",
  inactive: "outline",
  retired: "outline",
  disabled: "outline",
  closed: "outline",
  hidden: "outline",
  cancelled: "destructive",
  rejected: "destructive",
  failed: "destructive",
  banned: "destructive",
  suspended: "destructive",
  deactivated: "destructive",
  refunded: "secondary",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/** Semantic status pill for orders, payments, moderation, tickets, and accounts. */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().trim();
  const variant = STATUS_VARIANT_MAP[normalized] ?? "secondary";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
