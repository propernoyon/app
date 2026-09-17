import { cn } from "@/lib/utils/cn";

/**
 * Responsive product grid.
 *
 * One column on the narrowest phones, two from `xs` (400px), three from `md` and
 * a fixed four across from `lg` — the standard e-commerce ladder. The `xs` step
 * is deliberate: a card in a 2-up grid at 320px leaves ~110px of content, which
 * cannot hold a 44px-target quantity stepper, so the grid steps down instead of
 * the control shrinking.
 *
 * The gap grows with the viewport, but columns never exceed four: the content
 * container is capped at `80rem`, so a fifth column would only make each tile
 * narrower than the target it has to hold.
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
        "grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:gap-6",
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
