"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useDebouncedCallback } from "@/lib/utils/debounce";
import { cn } from "@/lib/utils/cn";
import type { ProductSort } from "@/lib/domain/product-sort";

export interface ShopToolbarLabels {
  searchLabel: string;
  searchPlaceholder: string;
  allCategories: string;
  inStockOnly: string;
  sortLabel: string;
  sortNameAsc: string;
  sortNameDesc: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  clearFilters: string;
}

interface CategoryOption {
  slug: string;
  name: string;
}

/**
 * Shop filters.
 *
 * Every control writes to the URL (via `router.replace`) rather than to local
 * state, so filters are shareable, survive the back button, and are applied on
 * the server. The search field is debounced, so typing causes one request per
 * pause instead of one per keystroke.
 */
export function ShopToolbar({
  basePath,
  current,
  categories,
  labels,
}: {
  basePath: string;
  current: {
    q: string;
    category: string;
    sort: ProductSort;
    inStock: boolean;
  };
  categories: CategoryOption[];
  labels: ShopToolbarLabels;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(current.q);

  const navigate = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (current.q) params.set("q", current.q);
    if (current.category) params.set("category", current.category);
    if (current.sort !== "nameAsc") params.set("sort", current.sort);
    if (current.inStock) params.set("inStock", "1");

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    // Any filter change returns to the first page.
    params.delete("page");

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
        scroll: false,
      });
    });
  };

  const searchNow = useDebouncedCallback((value: string) => {
    navigate({ q: value.trim() === "" ? null : value.trim() });
  }, 350);

  const hasFilters =
    current.q !== "" || current.category !== "" || current.inStock || current.sort !== "nameAsc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="shop-search" className="sr-only">
            {labels.searchLabel}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="shop-search"
            type="search"
            value={query}
            placeholder={labels.searchPlaceholder}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              searchNow(event.target.value);
            }}
            className={cn(
              "h-11 w-full rounded-lg border border-input bg-surface pl-9 text-foreground",
              query ? "pr-14" : "pr-3",
              "placeholder:text-muted-foreground hover:border-border-strong focus:border-primary",
            )}
          />
          {query ? (
            <button
              type="button"
              aria-label={labels.clearFilters}
              onClick={() => {
                setQuery("");
                navigate({ q: null });
              }}
              className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>

        {/* Two selects: side by side on phones and tablets, inline from `sm`.
            The min-widths only apply once there is room for them — as a
            non-wrapping row on a 320px screen they forced the page to scroll. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <label htmlFor="shop-category" className="sr-only">
            {labels.allCategories}
          </label>
          <Select
            id="shop-category"
            value={current.category}
            onChange={(event) => navigate({ category: event.target.value || null })}
            className="w-full min-w-0 sm:w-auto sm:min-w-40 sm:flex-none"
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>

          <label htmlFor="shop-sort" className="sr-only">
            {labels.sortLabel}
          </label>
          <Select
            id="shop-sort"
            value={current.sort}
            onChange={(event) => navigate({ sort: event.target.value })}
            className="w-full min-w-0 sm:w-auto sm:min-w-44 sm:flex-none"
          >
            <option value="nameAsc">{labels.sortNameAsc}</option>
            <option value="nameDesc">{labels.sortNameDesc}</option>
            <option value="priceAsc">{labels.sortPriceAsc}</option>
            <option value="priceDesc">{labels.sortPriceDesc}</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-small font-medium text-foreground">
          <input
            type="checkbox"
            checked={current.inStock}
            onChange={(event) => navigate({ inStock: event.target.checked ? "1" : null })}
            className="size-4 rounded border-border-strong text-primary focus:ring-primary"
          />
          {labels.inStockOnly}
        </label>

        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={cn(
              "text-caption text-muted-foreground transition-opacity",
              isPending ? "opacity-100" : "opacity-0",
            )}
          >
            <SlidersHorizontal aria-hidden="true" className="inline size-3.5" />
          </span>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                startTransition(() => {
                  router.replace(basePath, { scroll: false });
                });
              }}
            >
              {labels.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
