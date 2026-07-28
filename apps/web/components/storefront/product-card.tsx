import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { Product } from "@ecommercemultivendor/types";

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const image = product.images[0];
  const priceFrom = Math.min(product.basePrice, ...product.variants.map((v) => v.price));

  return (
    <Link href={`/${locale}/product/${product.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
        </div>
        <CardContent className="space-y-1 p-3">
          <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
          <p className="text-sm font-semibold">{formatPrice(priceFrom, product.currency, locale)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
