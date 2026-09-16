import { SectionHeading } from "./section-heading";
import { CategoryCard } from "@/components/category/category-card";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import { EmptyState } from "@/components/ui/empty-state";
import { listCategories } from "@/lib/api/categories";
import { tryLoad } from "@/lib/api/load";
import { getStoreContext } from "@/lib/store/context";
import { pluralize } from "@/lib/i18n/formats";

/**
 * "Shop by category" rail. Categories come from the API and are cached for an
 * hour; nothing is hard-coded, so a new category in the POS appears here on its
 * own. The section degrades to a friendly inline error if the store is down.
 */
export async function CategorySection({ limit = 10 }: { limit?: number }) {
  const { dict, href } = await getStoreContext();
  const result = await tryLoad(() => listCategories());

  return (
    <section className="container-page py-10 sm:py-12">
      <SectionHeading
        title={dict.home.categoriesTitle}
        subtitle={dict.home.categoriesSubtitle}
        actionHref={href("/shop")}
        actionLabel={dict.common.viewAll}
      />

      {!result.ok ? (
        <div className="mt-6">
          <ApiErrorState
            error={result.error}
            dict={dict}
            variant="inline"
            retrySlot={<RefreshButton label={dict.common.retry} variant="outline" size="sm" />}
          />
        </div>
      ) : result.data.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={dict.home.emptyProducts} description={dict.home.emptyProductsHint} />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {result.data.slice(0, limit).map((category) => (
            <li key={category.slug} className="min-w-0">
              <CategoryCard
                category={category}
                href={href(`/category/${category.slug}`)}
                productCountLabel={pluralize(
                  category.productCount,
                  dict.category.productCountOne,
                  dict.category.productCount,
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
