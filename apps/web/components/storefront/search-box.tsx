"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchSuggestions } from "@/lib/hooks/useSearch";
import { formatPrice } from "@/lib/format";

export function SearchBox({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: suggestions } = useSearchSuggestions(query);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  const hasResults =
    suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.brands.length > 0 ||
      suggestions.shops.length > 0);

  return (
    <div ref={containerRef} className={className}>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) go(`/${locale}/products?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <Input
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={placeholder}
          className="pe-10"
          autoComplete="off"
        />
          <button
            type="submit"
            aria-label="Search"
            className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Search className="h-4 w-4" />
          </button>
      </form>

      {open && query.trim().length >= 2 && (
          <div className="absolute z-50 mt-1.5 max-h-96 w-full max-w-xl overflow-auto rounded-lg border bg-popover text-popover-foreground shadow-lg">
            {!hasResults && <p className="p-4 text-sm text-muted-foreground">No matches for “{query}”.</p>}

            {suggestions?.products.map((product) => (
              <Link
                key={product.id}
                href={`/${locale}/product/${product.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                {product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt="" className="h-9 w-9 rounded-md border object-cover" />
                )}
                <span className="flex-1 truncate font-medium">{product.name}</span>
                <span className="text-xs font-semibold text-primary">{formatPrice(product.basePrice)}</span>
              </Link>
            ))}

            <SuggestionGroup
              label="Categories"
              items={suggestions?.categories ?? []}
              hrefFor={(slug) => `/${locale}/category/${slug}`}
              onNavigate={() => setOpen(false)}
            />
            <SuggestionGroup
              label="Brands"
              items={suggestions?.brands ?? []}
              hrefFor={(slug) => `/${locale}/products?brand=${slug}`}
              onNavigate={() => setOpen(false)}
            />
            <SuggestionGroup
              label="Shops"
              items={suggestions?.shops ?? []}
              hrefFor={(slug) => `/${locale}/store/${slug}`}
              onNavigate={() => setOpen(false)}
            />
          </div>
      )}
        </div>
      );
}

      function SuggestionGroup({
        label,
        items,
        hrefFor,
        onNavigate,
}: {
        label: string;
      items: {id: string; name: string; slug: string }[];
  hrefFor: (slug: string) => string;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

      return (
      <div className="border-t">
        <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {items.map((item) => (
            <Link key={item.id} href={hrefFor(item.slug)} onClick={onNavigate} className="block px-3 py-2 text-sm hover:bg-accent">
              {item.name}
            </Link>
      ))}
          </div>
        );
}
