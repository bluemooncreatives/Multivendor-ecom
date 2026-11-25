import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  href: string;
  name: string;
  imageUrl?: string | null;
  compact?: boolean;
  className?: string;
}

/** Reusable avatar-tile card used for Categories and Brands on Home and browse pages. */
export function CategoryCard({ href, name, imageUrl, compact = false, className }: CategoryCardProps) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <Card
        className={cn(
          "flex flex-col items-center gap-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
          compact ? "border-transparent bg-transparent p-2.5 shadow-none hover:bg-accent/60 hover:shadow-none" : "p-4",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full border bg-secondary transition-transform duration-200 group-hover:scale-105",
            compact ? "h-14 w-14" : "h-16 w-16",
          )}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" sizes="64px" />
          ) : (
            <span className="text-lg font-bold text-primary/80">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <span className={cn("line-clamp-1 font-medium group-hover:text-primary", compact ? "text-xs" : "text-sm")}>
          {name}
        </span>
      </Card>
    </Link>
  );
}
