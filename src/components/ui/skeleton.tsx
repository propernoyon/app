import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Loading placeholder. `shape` mirrors the element it stands in for so the
 * skeleton occupies the same box as the loaded content (no layout shift).
 */
export function Skeleton({
  className,
  shape = "block",
  ...props
}: ComponentPropsWithRef<"div"> & { shape?: "block" | "text" | "circle" | "media" }) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn(
        "animate-pulse bg-skeleton",
        shape === "text" && "h-4 rounded-sm",
        shape === "circle" && "rounded-full",
        shape === "media" && "aspect-square rounded-xl",
        shape === "block" && "rounded-md",
        className,
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      <Skeleton shape="media" className="rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton shape="text" className="w-3/4" />
        <Skeleton shape="text" className="h-3 w-1/3" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <Skeleton shape="text" className="h-5 w-16" />
          <Skeleton className="size-11 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, label }: { count?: number; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      // Must mirror ProductGrid exactly, or placeholders reflow on arrival.
      className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryChipsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-11 w-24 shrink-0 rounded-full" />
      ))}
    </div>
  );
}
