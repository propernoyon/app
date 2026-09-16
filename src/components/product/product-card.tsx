import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InteractiveCard } from "@/components/ui/card";
import { Price } from "@/components/ui/price";
import { displayUnit } from "@/lib/domain/unit";
import { isOutOfStock, type Product } from "@/lib/domain/product";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/i18n/formats";
import { AddToCartControl, type AddToCartLabels } from "./add-to-cart";
import { ProductImage } from "./product-image";
import { StockBadge } from "./stock-badge";

/**
 * The single product card used by home, shop, category and the related-products
 * rail — same anatomy everywhere: image, category, name, price, stock, add.
 *
 * A Server Component, so prices are formatted on the server and no locale or
 * currency data is shipped to the browser. Only the add-to-cart control is
 * interactive.
 */
export function ProductCard({
  product,
  dict,
  locale,
  currencyCode,
  href,
  cartHref,
  priority = false,
  sizes = "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 400px) 45vw, 90vw",
}: {
  product: Product;
  dict: Dictionary;
  locale: Locale;
  currencyCode: string;
  href: string;
  cartHref: string;
  priority?: boolean;
  sizes?: string;
}) {
  const unit = displayUnit(product);
  const outOfStock = isOutOfStock(product);
  const soldByBox = product.boxPrice > 0 && product.sellType !== "piece";

  const labels: AddToCartLabels = {
    addToCart: dict.common.addToCart,
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

  return (
    <InteractiveCard className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Link href={href} aria-hidden="true" tabIndex={-1} className="block">
          <ProductImage
            image={product.image}
            alt=""
            sizes={sizes}
            priority={priority}
            className={outOfStock ? "opacity-60 grayscale-[0.35]" : undefined}
          />
        </Link>

        {/* Only the stock badge sits over the image: with up to three badges the
            overlay collided on narrow tiles, so secondary badges moved into the
            body where there is room for them. */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start">
          <StockBadge status={product.stock.status} dict={dict} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        {product.category ? (
          <p className="truncate text-caption text-muted-foreground">{product.category.name}</p>
        ) : null}

        {/* Clamped so every card in a row is the same height, even with the
            longer Portuguese names. */}
        <h3 className="line-clamp-2 text-body-lg leading-snug font-semibold text-foreground">
          <Link href={href} className="underline-offset-4 hover:underline">
            {product.name}
          </Link>
        </h3>

        {soldByBox || product.isAgeRestricted ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {soldByBox ? (
              <Badge variant="accent" size="sm">
                {dict.product.soldByBox}
              </Badge>
            ) : null}
            {product.isAgeRestricted ? (
              <Badge variant="neutral" size="sm">
                <ShieldAlert aria-hidden="true" className="size-3" />
                {dict.age.badge}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto space-y-2.5 pt-2">
          <div>
            <Price
              value={formatPrice(product.price, locale, currencyCode)}
              size="lg"
              suffix={unit ? `/ ${unit}` : null}
            />
            {soldByBox ? (
              <p className="mt-0.5 text-caption text-muted-foreground">
                {dict.product.pricePerBox}:{" "}
                <span className="tabular-nums">
                  {formatPrice(product.boxPrice, locale, currencyCode)}
                </span>
              </p>
            ) : null}
          </div>

          <AddToCartControl
            product={product}
            locale={locale}
            currencyCode={currencyCode}
            cartHref={cartHref}
            labels={labels}
            compact
          />
        </div>
      </div>
    </InteractiveCard>
  );
}
