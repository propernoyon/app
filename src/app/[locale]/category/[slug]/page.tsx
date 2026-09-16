import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductResults } from "@/components/product/product-results";
import { listCategories } from "@/lib/api/categories";
import { tryLoad } from "@/lib/api/load";
import { listProducts } from "@/lib/api/products";
import { findCategoryBySlug } from "@/lib/domain/category";
import { DEFAULT_PRODUCT_SORT, parseProductSort, sortProducts } from "@/lib/domain/product-sort";
import { buildAlternates, clampDescription } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";
import { firstParam } from "@/lib/utils/params";

const PER_PAGE = 12;

/**
 * Dynamic category page: `/category/fruits`, `/category/coffee`, … The slug is
 * resolved against the live category list, so a category added in the POS gets a
 * working page immediately — nothing about categories is hard-coded.
 */
export async function generateMetadata(
  props: PageProps<"/[locale]/category/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const { dict, locale } = await getStoreContext();

  const categories = await listCategories().catch(() => []);
  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    return {
      title: dict.category.notFound,
      robots: { index: false, follow: true },
      alternates: buildAlternates(locale, `/category/${slug}`),
    };
  }

  const description = category.description
    ? clampDescription(category.description)
    : clampDescription(`${category.name} — ${dict.shop.subtitle}`);

  return {
    title: category.name,
    description,
    alternates: buildAlternates(locale, `/category/${category.slug}`),
    openGraph: { title: category.name, description, type: "website", locale },
  };
}

export default async function CategoryPage(props: PageProps<"/[locale]/category/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const categoriesResult = await tryLoad(() => listCategories());
  if (!categoriesResult.ok) {
    // Categories are non-fatal elsewhere, but here the category *is* the page —
    // so a failure is surfaced instead of being swallowed.
    return (
      <div className="container-page py-6 sm:py-8">
        <ProductResults
          result={{ ok: false, error: categoriesResult.error }}
          dict={dict}
          locale={locale}
          currencyCode={currencyCode}
          basePath={href(`/category/${slug}`)}
          query={{}}
          productHref={(id) => href(`/product/${id}`)}
          cartHref={href("/cart")}
          emptyTitle={dict.shop.loadError}
          emptyHint={dict.shop.loadErrorHint}
        />
      </div>
    );
  }

  const category = findCategoryBySlug(categoriesResult.data, slug);
  if (!category) notFound();

  const sort = parseProductSort(firstParam(searchParams.sort));
  const page = Math.max(1, Number.parseInt(firstParam(searchParams.page), 10) || 1);
  const inStock = firstParam(searchParams.inStock) === "1";

  const result = await tryLoad(() =>
    listProducts({
      categoryId: category.id,
      page,
      perPage: PER_PAGE,
      inStock,
    }),
  );

  if (result.ok) {
    result.data.products = sortProducts(result.data.products, sort);
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.nav.home, href: href("/") },
          { label: dict.shop.title, href: href("/shop") },
          { label: category.name },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-h1 text-foreground">{category.name}</h1>
        <p className="mt-1.5 text-body text-muted-foreground">
          {category.description
            ? clampDescription(category.description, 220)
            : `${dict.common.showing} ${category.productCount} ${dict.common.products}`}
        </p>
      </header>

      <div className="mt-8">
        <ProductResults
          result={result}
          dict={dict}
          locale={locale}
          currencyCode={currencyCode}
          basePath={href(`/category/${category.slug}`)}
          query={{
            sort: sort === DEFAULT_PRODUCT_SORT ? undefined : sort,
            inStock: inStock ? "1" : undefined,
          }}
          productHref={(id) => href(`/product/${id}`)}
          cartHref={href("/cart")}
          emptyTitle={dict.category.empty}
          emptyHint={dict.category.emptyHint}
        />
      </div>
    </div>
  );
}
