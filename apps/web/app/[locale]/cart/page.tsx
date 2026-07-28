"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useRemoveCartItem, useSetCartItem, type CartLineDetail } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";
import { formatPrice } from "@/lib/format";

function CartRow({ item }: { item: CartLineDetail }) {
  const removeItem = useRemoveCartItem();
  const setItem = useSetCartItem();

  function changeQuantity(delta: number) {
    const next = item.quantity + delta;
    if (next < 1) return;
    setItem.mutate({ productId: item.productId, variantSku: item.variantSku, quantity: next });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-0">
      <div className="flex items-center gap-3">
        {item.productImage && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={item.productImage} alt={item.productName ?? ""} fill className="object-cover" />
          </div>
        )}
        <div>
          <p className="font-medium">{item.productName}</p>
          <p className="text-sm text-muted-foreground">{Object.values(item.variantAttributes).join(" / ")}</p>
        </div>
      </div>

      <div className="flex items-center rounded-md border">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center hover:bg-accent disabled:opacity-40"
          onClick={() => changeQuantity(-1)}
          disabled={item.quantity <= 1 || setItem.isPending}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center hover:bg-accent disabled:opacity-40"
          onClick={() => changeQuantity(1)}
          disabled={item.quantity >= item.available || setItem.isPending}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="w-24 text-right font-semibold">{formatPrice(item.lineTotal, item.currency)}</p>

      <button
        type="button"
        onClick={() => removeItem.mutate({ productId: item.productId, variantSku: item.variantSku })}
        aria-label="Remove item"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { data: cart, isLoading } = useCart();

  return (
    <div className="container space-y-6 py-6">
      <CheckoutSteps current={1} />
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !cart || cart.items.length === 0 ? (
        <div className="rounded-lg bg-card p-10 text-center shadow-sm">
          <p className="mb-4 text-muted-foreground">{t("empty")}</p>
          <Button asChild>
            <Link href={`/${locale}/products`}>Return to Shop</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-card p-4 shadow-sm md:p-6">
            {cart.items.map((item) => (
              <CartRow key={`${item.productId}-${item.variantSku}`} item={item} />
            ))}
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href={`/${locale}/products`}>Return to Shop</Link>
              </Button>
            </div>
          </div>

          <div className="h-fit space-y-4 rounded-lg bg-card p-4 shadow-sm md:p-6">
            <h2 className="border-b pb-3 text-lg font-bold">Order Summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span>{t("subtotal")}</span>
              <span className="font-medium">{formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}</span>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href={`/${locale}/checkout`}>{t("checkout")}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
