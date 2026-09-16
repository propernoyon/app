import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ApiErrorState } from "@/components/layout/api-error-state";
import { RefreshButton } from "@/components/layout/refresh-button";
import type { AddToCartLabels } from "@/components/product/add-to-cart";
import { ProductActions } from "@/components/product/product-actions";
import { ProductImage } from "@/components/product/product-image";
import { ProductGrid, ProductGridItem } from "@/components/product/product-grid";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { StockBadge } from "@/components/product/stock-badge";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/json-ld";
import { tryLoad } from "@/lib/api/load";
import { getProduct, listRelatedProducts } from "@/lib/api/products";
import { displayUnit } from "@/lib/domain/unit";
import { formatNumber, formatPrice, formatPercent } from "@/lib/i18n/formats";
import { buildAlternates, clampDescription } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";
import { Suspense } from "react";

export async function generateMetadata(
  props: PageProps<"/[locale]/product/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const { dict, locale } = await getStoreContext();
  const productId = Number.parseInt(id, 10);

  if (!Number.isFinite(productId)) {
    return { title: dict.product.notFound, robots: { index: false, follow: true } };
  }

  const result = await tryLoad(() => getProduct(productId));
  const product = result.ok ? result.data : null;

  if (!product) {
    return {
      title: dict.product.notFound,
      robots: { index: false, follow: true },
      alternates: buildAlternates(locale, `/product/${id}`),
    };
  }

  const description = clampDescription(
    product.description?.trim() ||
      `${product.name}${product.category ? ` — ${product.category.name}` : ""} · ${dict.shop.title}`,
  );

  return {
    title: product.name,
    description,
    alternates: buildAlternates(locale, `/product/${product.id}`),
    openGraph: {
      type: "website",
      title: product.name,
      description,
      locale,
      // Only advertise a real image; the placeholder must not become the OG card.
      ...(product.image.source === "placeholder" ? {} : { images: [product.image.url] }),
    },
  };
}

/**
 * Product detail.
 *
 * Mirrors the POS's own vocabulary: prices and stock come straight from the API,
 * the box/piece switch only appears when the product is actually sold both ways,
 * and out-of-stock is enforced in the UI rather than hidden.
 */
export default async function ProductPage(props: PageProps<"/[locale]/product/[id]">) {
  const { id } = await props.params;
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const productId = Number.parseInt(id, 10);
  if (!Number.isFinite(productId) || productId <= 0) notFound();

  const result = await tryLoad(() => getProduct(productId));

  if (!result.ok) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg">
          <ApiErrorState
            error={result.error}
            dict={dict}
            retrySlot={<RefreshButton label={dict.common.retry} />}
          />
        </div>
      </div>
    );
  }

  const product = result.data;
  if (!product) notFound();

  const unit = displayUnit(product);

  const labels: AddToCartLabels = {
    addToCart: dict.product.addToCart,
    outOfStock: dict.product.outOfStock,
    addedToCart: dict.common.addedToCart,
    decrease: dict.common.decrease,
    increase: dict.common.increase,
    quantity: dict.common.quantity,
    soldByPiece: dict.product.soldByPiece,
    soldByBox: dict.product.soldByBox,
    maxReached: dict.product.maxReached,
    viewCart: dict.common.viewCart,
  };

  // Only include rows we actually have data for — an empty spec table is worse
  // than no spec table.
  const specs: { label: string; value: string }[] = [];
  if (product.sku) specs.push({ label: dict.product.sku, value: product.sku });
  if (product.barcode) specs.push({ label: dict.product.barcode, value: product.barcode });
  if (product.category) specs.push({ label: dict.product.category, value: product.category.name });
  if (unit) specs.push({ label: dict.product.unit, value: unit });
  if (product.piecesPerBox > 1)
    specs.push({
      label: dict.product.piecesPerBox,
      value: formatNumber(product.piecesPerBox, locale),
    });
  if (product.taxPercent > 0)
    specs.push({ label: dict.product.tax, value: formatPercent(product.taxPercent / 100, locale) });
  specs.push({
    label: dict.product.availability,
    value: `${formatNumber(product.stock.qty, locale)}${unit ? ` ${unit}` : ""}`,
  });

  return (
    <div className="container-page pt-6 pb-action-bar sm:pt-8 lg:pb-8">
      <ProductJsonLd product={product} locale={locale} currencyCode={currencyCode} />
      <BreadcrumbJsonLd
        items={[
          { name: dict.nav.home, path: href("/") },
          { name: dict.shop.title, path: href("/shop") },
          { name: product.name, path: href(`/product/${product.id}`) },
        ]}
      />

      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.nav.home, href: href("/") },
          { label: dict.shop.title, href: href("/shop") },
          { label: product.name },
        ]}
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <ProductImage
            image={product.image}
            alt={product.name}
            sizes="(min-width: 1024px) 46vw, 100vw"
            priority
            aspect="square"
            className="rounded-card border border-border"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={product.stock.status} dict={dict} size="md" />
            {product.isAgeRestricted ? (
              <Badge variant="neutral" size="md">
                <ShieldAlert aria-hidden="true" className="size-3.5" />
                {dict.product.ageBadge}
              </Badge>
            ) : null}
          </div>

          {product.category ? (
            <p className="mt-3 text-small text-muted-foreground">{product.category.name}</p>
          ) : null}
          <h1 className="mt-1 text-h1 text-foreground">{product.name}</h1>

          <div className="mt-4">
            <Price
              value={formatPrice(product.price, locale, currencyCode)}
              size="xl"
              suffix={unit ? `/ ${unit}` : null}
            />
            {product.boxPrice > 0 ? (
              <p className="mt-1 text-small text-muted-foreground">
                {dict.product.pricePerBox}:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatPrice(product.boxPrice, locale, currencyCode)}
                </span>
              </p>
            ) : null}
          </div>

          {product.description ? (
            <p className="mt-4 max-w-prose text-body text-subtle-foreground">
              {product.description}
            </p>
          ) : null}

          {product.isAgeRestricted ? (
            <p className="mt-4 text-small text-warning-foreground">{dict.product.ageNote}</p>
          ) : null}

          <ProductActions
            product={product}
            locale={locale}
            currencyCode={currencyCode}
            cartHref={href("/cart")}
            labels={labels}
            price={formatPrice(product.price, locale, currencyCode)}
            unavailableLabel={dict.product.unavailable}
            outOfStockLabel={dict.product.outOfStock}
          />

          <section className="mt-8">
            <h2 className="text-h4 text-foreground">{dict.product.specifications}</h2>
            <dl className="mt-3 divide-y divide-border overflow-hidden rounded-card border border-border">
              {specs.map((spec) => (
                <div key={spec.label} className="flex items-baseline gap-4 px-4 py-2.5">
                  <dt className="w-28 shrink-0 text-small text-muted-foreground">{spec.label}</dt>
                  <dd className="min-w-0 flex-1 text-small font-medium break-words text-foreground">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <Link
            href={href("/shop")}
            className="mt-6 inline-block text-small font-semibold text-primary underline-offset-4 hover:underline"
          >
            {dict.product.backToShop}
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mt-14">
            <ProductGridSkeleton count={4} label={dict.common.loadingProducts} />
          </div>
        }
      >
        <RelatedProducts productId={product.id} categoryId={product.category?.id ?? null} />
      </Suspense>
    </div>
  );
}

/** Related products, streamed so the main product renders immediately. */
async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: number;
  categoryId: number | null;
}) {
  const { dict, href, locale, currencyCode } = await getStoreContext();
  if (!categoryId) return null;

  const related = await listRelatedProducts({ id: productId, category: { id: categoryId } }, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-h2 text-foreground">{dict.product.relatedTitle}</h2>
      <p className="mt-1 text-small text-muted-foreground">{dict.product.relatedSubtitle}</p>
      <ProductGrid className="mt-6">
        {related.map((item) => (
          <ProductGridItem key={item.id}>
            <ProductCard
              product={item}
              dict={dict}
              locale={locale}
              currencyCode={currencyCode}
              href={href(`/product/${item.id}`)}
              cartHref={href("/cart")}
            />
          </ProductGridItem>
        ))}
      </ProductGrid>
    </section>
  );
}
