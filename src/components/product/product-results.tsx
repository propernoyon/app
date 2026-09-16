import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import { ProductCard } from "./product-card";
import { ProductGrid, ProductGridItem } from "./product-grid";
import type { ProductListResult } from "@/lib/api/normalize";
import type { LoadResult } from "@/lib/api/load";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Shared product listing: grid, pagination and the empty/error states.
 *
 * Used by both the shop and the category page so the two can never present
 * results differently. Rendered on the server — pagination is real `?page=`
 * links, not client-side slicing, so results stay crawlable and shareable.
 */
export function ProductResults({
  result,
  dict,
  locale,
  currencyCode,
  basePath,
  query,
  productHref,
  cartHref,
  emptyTitle,
  emptyHint,
  priorityCount = 4,
}: {
  result: LoadResult<ProductListResult>;
  dict: Dictionary;
  locale: Locale;
  currencyCode: string;
  basePath: string;
  query: Record<string, string | number | undefined | null>;
  productHref: (id: number) => string;
  cartHref: string;
  emptyTitle: string;
  emptyHint: string;
  priorityCount?: number;
}) {
  if (!result.ok) {
    return (
      <ApiErrorState
        error={result.error}
        dict={dict}
        title={dict.shop.loadError}
        retrySlot={<RefreshButton label={dict.common.retry} />}
      />
    );
  }

  const { products, pagination } = result.data;

  if (products.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyHint} />;
  }

  return (
    <div className="space-y-8">
      <ProductGrid>
        {products.map((product, index) => (
          <ProductGridItem key={product.id}>
            <ProductCard
              product={product}
              dict={dict}
              locale={locale}
              currencyCode={currencyCode}
              href={productHref(product.id)}
              cartHref={cartHref}
              priority={index < priorityCount}
            />
          </ProductGridItem>
        ))}
      </ProductGrid>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        basePath={basePath}
        query={{ ...query, page: undefined }}
        labels={{
          previous: dict.common.previous,
          next: dict.common.next,
          page: dict.common.pagination,
        }}
      />
    </div>
  );
}
