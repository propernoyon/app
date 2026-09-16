import { Suspense } from "react";
import type { Metadata } from "next";

import { CategorySection } from "@/components/home/category-section";
import { Hero } from "@/components/home/hero";
import { ProductSection } from "@/components/home/product-section";
import { PromoBanner } from "@/components/home/promo-banner";
import { ReorderSection } from "@/components/home/reorder-section";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { storeConfig } from "@/config/store";
import { buildAlternates, clampDescription } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";

/**
 * Home.
 *
 * A static shell that streams: the hero, promo and headings belong to the shell,
 * while each product rail resolves in its own Suspense boundary. The rails are
 * revalidated every 5 minutes and reuse the same cached products response.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getStoreContext();
  const description = clampDescription(dict.home.heroSubtitle);

  return {
    title: storeConfig.name,
    description,
    alternates: buildAlternates(locale, "/"),
    openGraph: {
      type: "website",
      title: storeConfig.name,
      description,
      siteName: storeConfig.name,
      locale,
    },
  };
}

function RailSkeleton({ label }: { label: string }) {
  return (
    <div className="container-page py-10 sm:py-12">
      <Skeleton className="h-7 w-52" shape="text" />
      <Skeleton className="mt-2 h-4 w-72" shape="text" />
      <div className="mt-6">
        <ProductGridSkeleton count={4} label={label} />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="container-page py-10 sm:py-12">
      <Skeleton className="h-7 w-56" shape="text" />
      <Skeleton className="mt-2 h-4 w-80" shape="text" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-card" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { dict, href, locale, currencyCode } = await getStoreContext();

  return (
    <>
      <OrganizationJsonLd locale={locale} siteName={storeConfig.name} />
      <WebsiteJsonLd locale={locale} siteName={storeConfig.name} />

      <Hero
        dict={dict}
        storeName={storeConfig.name}
        shopHref={href("/shop")}
        trackHref={href("/track-order")}
      />

      <Suspense fallback={<CategorySkeleton />}>
        <CategorySection />
      </Suspense>

      <PromoBanner dict={dict} shopHref={href("/shop")} />

      <Suspense fallback={<RailSkeleton label={dict.common.loadingProducts} />}>
        <ProductSection
          title={dict.home.featuredTitle}
          subtitle={dict.home.featuredSubtitle}
          limit={8}
          viewAllHref={href("/shop")}
        />
      </Suspense>

      <Suspense fallback={<RailSkeleton label={dict.common.loadingProducts} />}>
        <ProductSection
          title={dict.home.popularTitle}
          subtitle={dict.home.popularSubtitle}
          limit={4}
          offset={8}
          viewAllHref={href("/shop")}
        />
      </Suspense>

      <ReorderSection
        dict={dict}
        locale={locale}
        currencyCode={currencyCode}
        cartHref={href("/cart")}
      />
    </>
  );
}
