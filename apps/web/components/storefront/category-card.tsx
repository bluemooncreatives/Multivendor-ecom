import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  href: string;
  name: string;
  imageUrl?: string | null;
  compact?: boolean;
  className?: string;
}

/** Reusable avatar-tile card for categories and brands. */
export function CategoryCard({ href, name, imageUrl, compact = false, className }: CategoryCardProps) {
  if (compact) {
    return (
      <Link href={href} className={cn("group flex flex-col items-center gap-2 text-center", className)}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-muted p-0.5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
          <div className={cn(
            "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-secondary",
          )}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="56px"
              />
            ) : (
              <span className="text-xl font-black text-primary/70">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <span className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-foreground/80 transition-colors group-hover:text-primary">
          {name}
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-secondary transition-transform duration-300 group-hover:scale-105">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-3xl font-black text-primary/60">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
          {name}
        </span>
      </div>
    </Link>
  );
}
