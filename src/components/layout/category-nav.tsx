import Link from "next/link";

import type { Category } from "@/lib/domain/category";
import { cn } from "@/lib/utils/cn";

/**
 * Horizontal category rail for the desktop header.
 *
 * Purely presentational: the header fetches the (cached) category list once and
 * passes it to both this rail and the mobile drawer, so there is never a second
 * round trip. Categories always come from the API — nothing is hard-coded.
 */
export function CategoryNav({
  categories,
  allLabel,
  allHref,
  categoryHref,
  label,
  className,
}: {
  categories: readonly Category[];
  allLabel: string;
  allHref: string;
  categoryHref: (slug: string) => string;
  label: string;
  className?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ul className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        <li className="shrink-0">
          <Link
            href={allHref}
            className="inline-flex h-11 items-center rounded-full px-3 text-small font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {allLabel}
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={categoryHref(category.slug)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-small text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.name}
              {category.productCount > 0 ? (
                <span className="text-caption text-muted-foreground tabular-nums">
                  {category.productCount}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
