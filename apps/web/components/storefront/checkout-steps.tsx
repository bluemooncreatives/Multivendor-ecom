import {
  ShoppingCart,
  MapPin,
  Truck,
  CreditCard,
  ClipboardCheck,
  PartyPopper,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Cart", icon: ShoppingCart },
  { label: "Shipping", icon: MapPin },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: CreditCard },
  { label: "Review", icon: ClipboardCheck },
  { label: "Done", icon: PartyPopper },
];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 | 5 | 6 }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-5 shadow-xs">
      <ol className="flex items-center justify-between gap-2 overflow-x-auto">
        {STEPS.map((step, i) => {
          const num = i + 1;
          const active = num === current;
          const done = num < current;
          const Icon = done ? Check : step.icon;
          const isLast = i === STEPS.length - 1;

          return (
            <li key={step.label} className="flex flex-1 items-center gap-0">
              {/* Step circle + label */}
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-300",
                    active && "bg-primary text-primary-foreground shadow-colored shadow-sm ring-4 ring-primary/15",
                    done && "bg-success text-success-foreground",
                    !active && !done && "border border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] font-semibold sm:block",
                    active && "text-primary",
                    done && "text-success",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-all duration-300",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
