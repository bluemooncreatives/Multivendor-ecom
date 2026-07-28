"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCart, useRemoveCartItem, type CartLineDetail } from "@/lib/hooks/useCart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

function CartRow({ item }: { item: CartLineDetail }) {
  const removeItem = useRemoveCartItem();

  return (
    <div className="flex items-center justify-between gap-4 border-b py-4">
      <div className="flex items-center gap-3">
        {item.productImage && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={item.productImage} alt={item.productName ?? ""} fill className="object-cover" />
          </div>
        )}
        <div>
          <p className="font-medium">{item.productName}</p>
          <p className="text-sm text-muted-foreground">
            {Object.values(item.variantAttributes).join(" / ")} × {item.quantity}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="font-semibold">{formatPrice(item.lineTotal, item.currency)}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem.mutate({ productId: item.productId, variantSku: item.variantSku })}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { data: cart, isLoading } = useCart();

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !cart || cart.items.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div>
            {cart.items.map((item) => (
              <CartRow key={`${item.productId}-${item.variantSku}`} item={item} />
            ))}
          </div>
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(cart.subtotal ?? 0, cart.items[0]?.currency)}</span>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href={`/${locale}/checkout`}>{t("checkout")}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
