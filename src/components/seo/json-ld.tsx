import { absoluteUrl } from "@/config/env";
import { storeConfig } from "@/config/store";
import type { Product } from "@/lib/domain/product";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";
import { displayUnit } from "@/lib/domain/unit";

/** schema.org availability, mapped from the POS stock status. */
function availability(status: Product["stock"]["status"]): string {
  switch (status) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "low_stock":
      return "https://schema.org/LimitedAvailability";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    default:
      return "https://schema.org/InStock";
  }
}

/**
 * Serializes structured data safely.
 *
 * `<` is escaped so a product name containing `</script>` can never break out of
 * the tag — the standard mitigation for JSON-LD injection.
 */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function ProductJsonLd({
  product,
  locale,
  currencyCode,
}: {
  product: Product;
  locale: Locale;
  currencyCode: string;
}) {
  const url = absoluteUrl(localePath(locale, `/product/${product.id}`));
  const unit = displayUnit(product);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.barcode ? { gtin: product.barcode } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    ...(product.image.source === "placeholder" ? {} : { image: [product.image.url] }),
    brand: { "@type": "Brand", name: storeConfig.name },
    offers: {
      "@type": "Offer",
      url,
      price: product.price.toFixed(2),
      priceCurrency: currencyCode,
      availability: availability(product.stock.status),
      seller: { "@type": "Organization", name: storeConfig.name },
      ...(unit
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              referenceQuantity: { "@type": "QuantitativeValue", unitText: unit },
            },
          }
        : {}),
    },
  };

  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({ items }: { items: readonly { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return <JsonLd data={data} />;
}

export function OrganizationJsonLd({ locale, siteName }: { locale: Locale; siteName: string }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: siteName,
    url: absoluteUrl(localePath(locale, "/")),
    logo: absoluteUrl("/images/logo.png"),
    image: absoluteUrl("/images/logo.png"),
    ...(storeConfig.phone ? { telephone: storeConfig.phone } : {}),
    ...(storeConfig.email ? { email: storeConfig.email } : {}),
    ...(storeConfig.address
      ? { address: { "@type": "PostalAddress", streetAddress: storeConfig.address } }
      : {}),
    ...(storeConfig.openingHours ? { openingHours: storeConfig.openingHours } : {}),
  };

  return <JsonLd data={data} />;
}

export function WebsiteJsonLd({ locale, siteName }: { locale: Locale; siteName: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl(localePath(locale, "/")),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(localePath(locale, "/shop"))}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLd data={data} />;
}

export function ItemListJsonLd({
  name,
  products,
  locale,
}: {
  name: string;
  products: readonly { id: number; name: string }[];
  locale: Locale;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(localePath(locale, `/product/${product.id}`)),
      name: product.name,
    })),
  };

  return <JsonLd data={data} />;
}
