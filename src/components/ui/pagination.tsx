import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Path without query string, e.g. `/en/shop`. */
  basePath: string;
  /** Current filters, preserved on every page link. */
  query?: Record<string, string | number | undefined | null>;
  labels: { previous: string; next: string; page: string };
  className?: string;
}

function hrefFor(
  basePath: string,
  query: Record<string, string | number | undefined | null> | undefined,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Windowed page list with ellipses, so 40 pages don't produce 40 links. */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("gap");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("gap");
  items.push(total);
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  query,
  labels,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const itemClass =
    "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-small font-semibold transition-colors duration-150";
  const linkClass = cn(itemClass, "border-border-strong bg-surface text-foreground hover:bg-muted");

  return (
    <nav aria-label={labels.page} className={cn("flex justify-center", className)}>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {currentPage > 1 ? (
            <Link
              href={hrefFor(basePath, query, currentPage - 1)}
              rel="prev"
              aria-label={labels.previous}
              className={linkClass}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(itemClass, "border-border text-muted-foreground opacity-50")}
            >
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>

        {pageItems(currentPage, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(basePath, query, item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={cn(
                  itemClass,
                  item === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface text-foreground hover:bg-muted",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {currentPage < totalPages ? (
            <Link
              href={hrefFor(basePath, query, currentPage + 1)}
              rel="next"
              aria-label={labels.next}
              className={linkClass}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(itemClass, "border-border text-muted-foreground opacity-50")}
            >
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
