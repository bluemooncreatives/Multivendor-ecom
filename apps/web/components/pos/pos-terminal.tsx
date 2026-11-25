"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Search, Trash2, Receipt, UserCheck } from "lucide-react";
import {
  usePosProductSearch,
  useCreatePosSale,
  openPosReceipt,
  type PosProduct,
  type PosVariant,
  type PosCustomer,
  usePosCustomers,
  usePosQuote,
} from "@/lib/hooks/usePos";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/shared/form-field";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/utils";

interface Line {
  productId: string;
  variantSku: string;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  available: number;
}

export function PosTerminal({ scope }: { scope: "seller" | "admin" }) {
  const userId = useAuthStore((state) => state.user?.id);
  return <PosTill key={`${userId}:${scope}`} scope={scope} draftKey={`pos-draft:${userId}:${scope}`} />;
}

function PosTill({ scope, draftKey }: { scope: "seller" | "admin"; draftKey: string }) {
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = usePosProductSearch(query);
  const createSale = useCreatePosSale();
  const attempt = useRef<string | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentType, setPaymentType] = useState<"cash" | "card" | "wallet" | "manual">("cash");
  const [walkIn, setWalkIn] = useState({ name: "", phone: "", email: "", address: "", city: "", postalCode: "" });
  const [customerQuery, setCustomerQuery] = useState("");
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const { data: customers } = usePosCustomers(customerQuery);
  const [lastSale, setLastSale] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const { data: quote, isFetching: quoting, error: quoteError } = usePosQuote({
    items: lines.map(({ productId, variantSku, quantity }) => ({ productId, variantSku, quantity })),
    discount,
    shippingCost,
  });

  const subtotal = quote?.subtotal ?? 0;
  const total = quote?.grandTotal ?? 0;
  const currency = quote?.currency ?? "INR";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          Array.isArray(saved.lines) &&
          saved.lines.every(
            (line: Line) =>
              typeof line.productId === "string" &&
              typeof line.variantSku === "string" &&
              Number.isSafeInteger(line.quantity) &&
              line.quantity > 0,
          )
        )
          setLines(saved.lines);
        if (Number.isFinite(saved.discount) && saved.discount >= 0) setDiscount(saved.discount);
        if (Number.isFinite(saved.shippingCost) && saved.shippingCost >= 0) setShippingCost(saved.shippingCost);
        if (saved.walkIn && typeof saved.walkIn.name === "string" && typeof saved.walkIn.phone === "string") setWalkIn(saved.walkIn);
        if (saved.customer?.id) setCustomer(saved.customer);
        if (["cash", "card", "wallet", "manual"].includes(saved.paymentType)) setPaymentType(saved.paymentType);
        if (typeof saved.attempt === "string") attempt.current = saved.attempt;
      }
    } catch {
      /* An invalid or unavailable draft does not block opening the till. */
    }
    setDraftLoaded(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({ lines, discount, shippingCost, walkIn, customer, paymentType, attempt: attempt.current }),
      );
    } catch {
      /* Storage can be disabled by the browser. */
    }
  }, [draftKey, draftLoaded, lines, discount, shippingCost, walkIn, customer, paymentType]);

  function addLine(product: PosProduct, variant: PosVariant) {
    const available = variant.stock - variant.reserved;
    if (available <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    setLines((prev) => {
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
          price: product.pricing?.variants.find((v) => v.sku === variant.sku)?.price ?? variant.price,
          quantity: 1,
          available,
        },
      ];
    });

    setQuery("");
  }

  async function handleCheckout() {
    if (lines.length === 0) return;
    if (!customer && (!walkIn.name || !walkIn.phone)) {
      toast.error("Enter the customer's name and phone");
      return;
    }

    try {
      attempt.current ??= crypto.randomUUID();
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ lines, discount, shippingCost, walkIn, customer, paymentType, attempt: attempt.current }),
        );
      } catch {
        /* Optional draft recovery. */
      }
      const order = await createSale.mutateAsync({
        idempotencyKey: (attempt.current ??= crypto.randomUUID()),
        items: lines.map((l) => ({ productId: l.productId, variantSku: l.variantSku, quantity: l.quantity })),
        customerId: customer?.id,
        walkIn: customer
          ? null
          : {
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
      setLastSale(order.id);
      attempt.current = null;
      setLines([]);
      setDiscount(0);
      setShippingCost(0);
      setWalkIn({ name: "", phone: "", email: "", address: "", city: "", postalCode: "" });
      setCustomer(null);
      setCustomerQuery("");
      setPaymentType("cash");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record sale"));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_25rem]">
      <div className="space-y-5">
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-3.5">
            <CardTitle className="text-base">Find a product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="ps-9"
                placeholder="Scan a barcode, or type a name or SKU"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {query.trim().length >= 2 && (
              <div className="space-y-2 pt-1">
                {isFetching && <p className="text-sm text-muted-foreground">Searching…</p>}
                {results?.length === 0 && !isFetching && <p className="text-sm text-muted-foreground">No matches.</p>}

                {results?.map((product) => (
                  <div key={product.id} className="rounded-lg border bg-muted/10 p-3">
                    <p className="text-sm font-semibold">{product.name}</p>
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
                            <span className="ms-1.5 text-xs text-muted-foreground">
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
          <CardHeader className="border-b bg-muted/20 pb-3.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Registered customer</Label>
              {customer ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                  <span className="font-medium">
                    {customer.name} · {customer.email || customer.phone}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomer(null);
                      setPaymentType("cash");
                    }}
                  >
                    Use walk-in
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Find by name, phone or email (3+ characters)"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                  />
                  {customerQuery.trim().length >= 3 &&
                    customers?.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="block w-full rounded-lg border px-3 py-2 text-start text-sm transition-colors hover:bg-accent"
                        onClick={() => {
                          setCustomer(item);
                          setCustomerQuery("");
                        }}
                      >
                        {item.name} · {item.email} {item.phone && `· ${item.phone}`}
                      </button>
                    ))}
                </>
              )}
            </div>
            {!customer && (
              <>
                <FormField label="Name" required>
                  <Input value={walkIn.name} onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })} required />
                </FormField>
                <FormField label="Phone" required>
                  <Input value={walkIn.phone} onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })} required />
                </FormField>
                <FormField label="Email">
                  <Input type="email" value={walkIn.email} onChange={(e) => setWalkIn({ ...walkIn, email: e.target.value })} />
                </FormField>
                <FormField label="City">
                  <Input value={walkIn.city} onChange={(e) => setWalkIn({ ...walkIn, city: e.target.value })} />
                </FormField>
                <FormField label="Address" className="sm:col-span-2">
                  <Input value={walkIn.address} onChange={(e) => setWalkIn({ ...walkIn, address: e.target.value })} />
                </FormField>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Sale</CardTitle>
          {scope === "admin" && <Badge variant="outline">Admin till</Badge>}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {lines.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Scan or search to add items.</p>
          ) : (
            <div className="divide-y">
              {lines.map((line, i) => (
                <div key={`${line.productId}-${line.variantSku}`} className="flex items-center gap-2 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{line.name}</p>
                    {line.variantLabel && <p className="text-xs text-muted-foreground">{line.variantLabel}</p>}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={line.available}
                    className="h-8 w-16"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, idx) =>
                          idx === i ? { ...l, quantity: Math.min(l.available, Math.max(1, Number(e.target.value))) } : l,
                        ),
                      )
                    }
                  />
                  <span className="w-20 text-end font-semibold">
                    {formatPrice(
                      (quote?.items.find((item) => item.productId === line.productId && item.variantSku === line.variantSku)?.unitPrice ??
                        line.price) * line.quantity,
                      currency,
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remove line"
                    onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pos-discount" className="text-sm">
                Discount
              </Label>
              <Input
                id="pos-discount"
                type="number"
                min={0}
                max={subtotal}
                className="h-9 w-28"
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
                className="h-9 w-28"
                value={shippingCost}
                onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="pos-payment" className="text-sm">
                Payment
              </Label>
              <div className="w-28">
                <NativeSelect
                  id="pos-payment"
                  className="h-9"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as typeof paymentType)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="wallet" disabled={!customer}>
                    Wallet
                  </option>
                  <option value="manual">Other</option>
                </NativeSelect>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatPrice(quote?.discount ?? 0, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(quote?.tax ?? 0, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span>{formatPrice(quote?.shippingCost ?? shippingCost, currency)}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{quoting ? "Updating…" : formatPrice(total, currency)}</span>
            </div>
            {quoteError && (
              <p className="text-xs text-destructive">
                {getApiErrorMessage(quoteError, "Could not quote these items")}
              </p>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={lines.length === 0 || createSale.isPending || quoting || !quote || !!quoteError}
          >
            Complete sale
          </Button>
          {lastSale && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void openPosReceipt(lastSale).catch(() => toast.error("Could not open the receipt"))}
            >
              <Receipt className="h-4 w-4" />
              Open last receipt
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
