import { SectionHeading } from "./section-heading";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid, ProductGridItem } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { tryLoad } from "@/lib/api/load";
import { MAX_PER_PAGE, listProducts } from "@/lib/api/products";
import { getStoreContext } from "@/lib/store/context";
import type { Product } from "@/lib/domain/product";

/**
 * A titled rail of products — used for both "Featured" and "Popular" so the two
 * sections can never drift apart visually.
 *
 * The POS list endpoint has no `sort` parameter (it always orders by name), so
 * rails that would otherwise show identical products use an `offset` to select a
 * different window of the same cached response.
 *
 * Loads its own data so it can stream inside a Suspense boundary; only the first
 * few tiles are `priority`, the rest lazy-load.
 */
export async function ProductSection({
  title,
  subtitle,
  limit = 8,
  offset = 0,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  limit?: number;
  offset?: number;
  viewAllHref?: string;
}) {
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const result = await tryLoad(() =>
    listProducts({ perPage: Math.min(limit + offset, MAX_PER_PAGE) }),
  );

  let products: Product[] = [];
  if (result.ok) {
    const window = result.data.products.slice(offset, offset + limit);
    // Not enough products to fill the offset window — show from the start
    // rather than rendering an empty section.
    products = window.length > 0 ? window : result.data.products.slice(0, limit);
  }

  return (
    <section className="container-page py-10 sm:py-12">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        actionHref={viewAllHref}
        actionLabel={dict.common.viewAll}
      />

      <div className="mt-6">
        {!result.ok ? (
          <ApiErrorState
            error={result.error}
            dict={dict}
            variant="inline"
            retrySlot={<RefreshButton label={dict.common.retry} variant="outline" size="sm" />}
          />
        ) : products.length === 0 ? (
          <EmptyState title={dict.home.emptyProducts} description={dict.home.emptyProductsHint} />
        ) : (
          <ProductGrid>
            {products.map((product, index) => (
              <ProductGridItem key={product.id}>
                <ProductCard
                  product={product}
                  dict={dict}
                  locale={locale}
                  currencyCode={currencyCode}
                  href={href(`/product/${product.id}`)}
                  cartHref={href("/cart")}
                  priority={index < 4}
                />
              </ProductGridItem>
            ))}
          </ProductGrid>
        )}
      </div>
    </section>
  );
}
