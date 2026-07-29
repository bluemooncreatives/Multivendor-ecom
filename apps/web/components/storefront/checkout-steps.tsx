import { ShoppingCart, MapPin, Truck, CreditCard, ClipboardCheck, PartyPopper } from "lucide-react";

// Mirrors the legacy four-page checkout: shipping info, delivery info, payment
// select, then confirm — with cart and confirmation as the bookends.
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
    <ol className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-lg bg-card p-4 shadow-sm">
      {STEPS.map((step, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        const Icon = step.icon;
        return (
          <li key={step.label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                active || done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className={`text-sm font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
