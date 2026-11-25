"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchSuggestions } from "@/lib/hooks/useSearch";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SearchBox({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: suggestions } = useSearchSuggestions(query);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
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
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={placeholder}
          className="h-10 rounded-xl border-border/70 bg-muted/40 pe-16 ps-10 text-sm transition-all focus-visible:bg-background"
          autoComplete="off"
        />
        <div className="absolute end-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground lg:inline-block">
            ⌘K
          </kbd>
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 max-h-96 w-full max-w-xl animate-zoom-in overflow-auto rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-xl">
          {!hasResults && (
            <p className="p-5 text-center text-sm text-muted-foreground">
              No matches for “{query}”.
            </p>
          )}

          {suggestions && suggestions.products.length > 0 && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Products
              </p>
              {suggestions.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/product/${product.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  {product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-lg border object-cover"
                    />
                  )}
                  <span className="flex-1 truncate font-medium">{product.name}</span>
                  <span className="text-xs font-bold tabular-nums text-primary">
                    {formatPrice(product.basePrice)}
                  </span>
                </Link>
              ))}
            </div>
          )}

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
  items: { id: string; name: string; slug: string }[];
  hrefFor: (slug: string) => string;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-1 border-t pt-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {items.map((item) => (
        <Link
          key={item.id}
          href={hrefFor(item.slug)}
          onClick={onNavigate}
          className={cn(
            "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent",
          )}
        >
          <span className="truncate font-medium">{item.name}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
