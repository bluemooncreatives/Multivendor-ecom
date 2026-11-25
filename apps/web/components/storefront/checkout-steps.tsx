import { ShoppingCart, MapPin, Truck, CreditCard, ClipboardCheck, PartyPopper, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Cart", icon: ShoppingCart },
  { label: "Shipping", icon: MapPin },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: CreditCard },
  { label: "Review", icon: ClipboardCheck },
  { label: "Confirmation", icon: PartyPopper },
];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 | 5 | 6 }) {
  return (
    <Card className="p-4">
      <ol className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        {STEPS.map((step, i) => {
          const num = i + 1;
          const active = num === current;
          const done = num < current;
          const Icon = done ? Check : step.icon;
          return (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  active && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                  done && "border-emerald-600 bg-emerald-600 text-white",
                  !active && !done && "border-border bg-secondary text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  active && "font-semibold text-primary",
                  done && "text-foreground",
                  !active && !done && "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
