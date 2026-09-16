import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductResults } from "@/components/product/product-results";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { listCategories } from "@/lib/api/categories";
import { tryLoad } from "@/lib/api/load";
import { listProducts } from "@/lib/api/products";
import { findCategoryBySlug } from "@/lib/domain/category";
import { DEFAULT_PRODUCT_SORT, parseProductSort, sortProducts } from "@/lib/domain/product-sort";
import { buildAlternates, clampDescription } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";
import { firstParam } from "@/lib/utils/params";

/** 12 fills 2, 3 and 4 column grids evenly. */
const PER_PAGE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getStoreContext();

  return {
    title: dict.shop.title,
    description: clampDescription(dict.shop.subtitle),
    alternates: buildAlternates(locale, "/shop"),
  };
}

/**
 * Shop / all products.
 *
 * Filters live in the URL (`?q=&category=&sort=&inStock=&page=`), so the page is
 * request-time but its underlying product fetch is still served from the data
 * cache. Search and pagination are handled by the POS endpoint itself.
 */
export default async function ShopPage(props: PageProps<"/[locale]/shop">) {
  const searchParams = await props.searchParams;
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const q = firstParam(searchParams.q).trim();
  const categorySlug = firstParam(searchParams.category).trim();
  const sort = parseProductSort(firstParam(searchParams.sort));
  const inStock = firstParam(searchParams.inStock) === "1";
  const page = Math.max(1, Number.parseInt(firstParam(searchParams.page), 10) || 1);

  const categories = await listCategories().catch(() => []);
  const activeCategory = categorySlug ? findCategoryBySlug(categories, categorySlug) : null;
  // An unknown slug must not silently show everything: use an impossible id so
  // the endpoint returns nothing and the empty state explains it.
  const categoryId = categorySlug ? (activeCategory?.id ?? -1) : undefined;

  const result = await tryLoad(() =>
    listProducts({ search: q, categoryId, page, perPage: PER_PAGE, inStock }),
  );

  if (result.ok) {
    result.data.products = sortProducts(result.data.products, sort);
  }

  const query = {
    q: q || undefined,
    category: categorySlug || undefined,
    sort: sort === DEFAULT_PRODUCT_SORT ? undefined : sort,
    inStock: inStock ? "1" : undefined,
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[{ label: dict.nav.home, href: href("/") }, { label: dict.shop.title }]}
      />

      <header className="mt-4">
        <h1 className="text-h1 text-foreground">{dict.shop.title}</h1>
        <p className="mt-1.5 text-body text-muted-foreground">
          {result.ok && result.data.pagination.total > 0
            ? `${dict.common.showing} ${result.data.products.length} ${dict.common.of} ${result.data.pagination.total} ${dict.common.results}`
            : dict.shop.subtitle}
        </p>
      </header>

      <div className="mt-6">
        <ShopToolbar
          basePath={href("/shop")}
          current={{ q, category: categorySlug, sort, inStock }}
          categories={categories.map((category) => ({
            slug: category.slug,
            name: category.name,
          }))}
          labels={{
            searchLabel: dict.shop.searchLabel,
            searchPlaceholder: dict.common.searchPlaceholder,
            allCategories: dict.shop.allCategories,
            inStockOnly: dict.shop.inStockOnly,
            sortLabel: dict.shop.sort.label,
            sortNameAsc: dict.shop.sort.nameAsc,
            sortNameDesc: dict.shop.sort.nameDesc,
            sortPriceAsc: dict.shop.sort.priceAsc,
            sortPriceDesc: dict.shop.sort.priceDesc,
            clearFilters: dict.shop.clearFilters,
          }}
        />
      </div>

      {sort === "priceAsc" || sort === "priceDesc" ? (
        <p className="mt-3 text-caption text-muted-foreground">{dict.shop.sortWithinPageNote}</p>
      ) : null}

      <div className="mt-8">
        <ProductResults
          result={result}
          dict={dict}
          locale={locale}
          currencyCode={currencyCode}
          basePath={href("/shop")}
          query={query}
          productHref={(id) => href(`/product/${id}`)}
          cartHref={href("/cart")}
          emptyTitle={q || categorySlug ? dict.shop.noResults : dict.shop.empty}
          emptyHint={q || categorySlug ? dict.shop.noResultsHint : dict.shop.emptyHint}
        />
      </div>
    </div>
  );
}
