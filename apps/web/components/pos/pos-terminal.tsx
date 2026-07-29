"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search, Trash2 } from "lucide-react";
import {
  usePosProductSearch,
  useCreatePosSale,
  openPosReceipt,
  type PosProduct,
  type PosVariant,
} from "@/lib/hooks/usePos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

interface Line {
  productId: string;
  variantSku: string;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  available: number;
}

/**
 * The shared till. Seller and admin render the same component; the API decides
 * scope from the caller's role, so an admin operator can ring up any vendor's
 * stock while a seller is restricted to their own.
 */
export function PosTerminal({ scope }: { scope: "seller" | "admin" }) {
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = usePosProductSearch(query);
  const createSale = useCreatePosSale();

  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentType, setPaymentType] = useState<"cash" | "card" | "wallet" | "manual">("cash");
  const [walkIn, setWalkIn] = useState({ name: "", phone: "", email: "", address: "", city: "", postalCode: "" });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = Math.max(0, subtotal - discount) + shippingCost;

  function addLine(product: PosProduct, variant: PosVariant) {
    const available = variant.stock - variant.reserved;
    if (available <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setLines((prev) => {
      // Scanning the same barcode twice increments the line rather than adding a
      // duplicate row, which is what an operator expects at a counter.
      const existing = prev.findIndex((l) => l.productId === product.id && l.variantSku === variant.sku);
      if (existing >= 0) {
        const line = prev[existing]!;
        if (line.quantity >= available) {
          toast.error(`Only ${available} in stock`);
          return prev;
        }
        return prev.map((l, i) => (i === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }

      return [
        ...prev,
        {
          productId: product.id,
          variantSku: variant.sku,
          name: product.name,
          variantLabel: Object.values(variant.attributes ?? {}).join(" / "),
          price: variant.price,
          quantity: 1,
          available,
        },
      ];
    });

    setQuery("");
  }

  async function handleCheckout() {
    if (lines.length === 0) return;
    if (!walkIn.name || !walkIn.phone) {
      toast.error("Enter the customer's name and phone");
      return;
    }

    try {
      const order = await createSale.mutateAsync({
        items: lines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })),
        walkIn: {
          name: walkIn.name,
          phone: walkIn.phone,
          email: walkIn.email || undefined,
          address: walkIn.address || undefined,
          city: walkIn.city || undefined,
          postalCode: walkIn.postalCode || undefined,
        },
        discount,
        shippingCost,
        paymentType,
      });

      toast.success(`Sale recorded: ${order.code}`);
      setLines([]);
      setDiscount(0);
      setShippingCost(0);
      setWalkIn({ name: "", phone: "", email: "", address: "", city: "", postalCode: "" });

      // Offered rather than opened automatically: a pop-up blocker would swallow
      // an unprompted window and the operator would think printing failed.
      void openPosReceipt(order.id).catch(() => toast.error("Could not open the receipt"));
    } catch (err) {
      const response = (err as { response?: { data?: { message?: string } } })?.response;
      toast.error(response?.data?.message ?? "Could not record sale");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Find a product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                className="ps-9"
                placeholder="Scan a barcode, or type a name or SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {query.trim().length >= 2 && (
              <div className="space-y-2">
                {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
                {results?.length === 0 && !isFetching && <p className="text-sm text-muted-foreground">No matches.</p>}

                {results?.map((product) => (
                  <div key={product.id} className="rounded-md border p-3">
                    <p className="text-sm font-medium">{product.name}</p>
                    {/* Every variant is listed: picking the first automatically
                        made multi-variant products unsellable at the counter. */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.variants.map((variant) => {
                        const available = variant.stock - variant.reserved;
                        return (
                          <Button
                            key={variant.sku}
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={available <= 0}
                            onClick={() => addLine(product, variant)}
                          >
                            {Object.values(variant.attributes ?? {}).join(" / ") || variant.sku}
                            <span className="ms-2 text-xs text-muted-foreground">
                              {formatPrice(variant.price, product.currency)} · {available}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={walkIn.name} onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input value={walkIn.phone} onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={walkIn.email} onChange={(e) => setWalkIn({ ...walkIn, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>City</Label>
              <Input value={walkIn.city} onChange={(e) => setWalkIn({ ...walkIn, city: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Address</Label>
              <Input value={walkIn.address} onChange={(e) => setWalkIn({ ...walkIn, address: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">
            Sale {scope === "admin" && <Badge variant="outline">Admin till</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Scan or search to add items.</p>
          ) : (
            lines.map((line, i) => (
              <div key={`${line.productId}-${line.variantSku}`} className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{line.name}</p>
                  {line.variantLabel && <p className="text-xs text-muted-foreground">{line.variantLabel}</p>}
                </div>
                <Input
                  type="number"
                  min={1}
                  max={line.available}
                  className="w-16"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, idx) =>
                        idx === i ? { ...l, quantity: Math.min(l.available, Math.max(1, Number(e.target.value))) } : l,
                      ),
                    )
                  }
                />
                <span className="w-20 text-end">{formatPrice(line.price * line.quantity)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove line"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pos-discount" className="text-sm">
                Discount
              </Label>
              <Input
                id="pos-discount"
                type="number"
                min={0}
                max={subtotal}
                className="w-28"
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pos-shipping" className="text-sm">
                Delivery
              </Label>
              <Input
                id="pos-shipping"
                type="number"
                min={0}
                className="w-28"
                value={shippingCost}
                onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pos-payment" className="text-sm">
                Payment
              </Label>
              <select
                id="pos-payment"
                className="h-10 w-28 rounded-md border bg-background px-2 text-sm"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as typeof paymentType)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="wallet">Wallet</option>
                <option value="manual">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tax is added from each product's rate when the sale is recorded.</p>
          </div>

          <Button className="w-full" onClick={handleCheckout} disabled={lines.length === 0 || createSale.isPending}>
            Complete sale
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
