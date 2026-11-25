import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  href: string;
  name: string;
  imageUrl?: string | null;
  count?: number;
  compact?: boolean;
  className?: string;
}

/** Reusable editorial tile for categories and brands. */
export function CategoryCard({ href, name, imageUrl, count, compact = false, className }: CategoryCardProps) {
  if (compact) {
    return (
      <Link href={href} className={cn("group flex flex-col gap-2.5", className)}>
        <div className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-secondary">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 33vw, 12vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-display text-3xl font-bold text-foreground/25">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="line-clamp-1 text-center text-[13px] font-semibold text-foreground transition-colors group-hover:text-muted-foreground">
          {name}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-secondary">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-display text-5xl font-bold text-foreground/20">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent opacity-80" />
        <div className="absolute inset-x-5 bottom-5 flex items-center justify-between text-background">
          <div>
            <p className="text-lg font-semibold leading-tight">{name}</p>
            {count !== undefined && <p className="text-xs text-background/75">{count} items</p>}
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground transition-transform group-hover:rotate-45">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
