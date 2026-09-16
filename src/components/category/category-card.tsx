import Link from "next/link";

import { safeCategoryColor, type Category } from "@/lib/domain/category";

/**
 * Category tile for the home page and category rails.
 *
 * The accent colour comes from the API per category. It is applied as an inline
 * style because the value is data, not a design token — but it is validated by
 * `safeCategoryColor` first, so a malformed value can never break the layout.
 */
export function CategoryCard({
  category,
  href,
  productCountLabel,
  className,
}: {
  category: Category;
  href: string;
  /** Pre-formatted count label, e.g. "12 products". */
  productCountLabel: string;
  className?: string;
}) {
  const color = safeCategoryColor(category.color);
  const initial = category.name.trim().charAt(0).toUpperCase() || "•";

  return (
    <Link
      href={href}
      className={[
        "group/category flex flex-col gap-3 rounded-card border border-border bg-card p-4 shadow-card",
        "transition-[box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-soft)]",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        "motion-reduce:hover:translate-y-0",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-xl text-h3 font-bold"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-body-lg font-semibold text-foreground">
          {category.name}
        </span>
        <span className="mt-0.5 block text-caption text-muted-foreground tabular-nums">
          {productCountLabel}
        </span>
      </span>
    </Link>
  );
}
