import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  /** Omitted on the final (current) item. */
  href?: string;
}

/**
 * Breadcrumb trail. The last item is marked `aria-current="page"` and is not a
 * link, as required for an accurate navigation landmark.
 */
export function Breadcrumbs({
  items,
  label,
  className,
}: {
  items: readonly BreadcrumbItem[];
  label: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-caption text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate underline-offset-4 hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
