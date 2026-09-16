import { cn } from "@/lib/utils/cn";

/**
 * Responsive product grid.
 *
 * One column on the narrowest phones, two from `xs` (400px), three from `lg` and
 * four from `xl`. The extra breakpoint is deliberate: a card in a 2-up grid at
 * 320px leaves ~110px of content, which cannot hold a 44px-target quantity
 * stepper — so the grid steps down instead of the control shrinking.
 */
export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </ul>
  );
}

/** Grid cell, so pages don't repeat `<li>` bookkeeping. */
export function ProductGridItem({ children }: { children: React.ReactNode }) {
  return <li className="min-w-0">{children}</li>;
}
