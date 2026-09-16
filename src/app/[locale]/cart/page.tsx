import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CartView, type CartLabels } from "@/components/cart/cart-view";
import { getStoreContext } from "@/lib/store/context";
import { buildAlternates } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getStoreContext();
  return {
    title: dict.cart.title,
    // A cart is per-visitor: keep it out of the index.
    robots: { index: false, follow: true },
    alternates: buildAlternates(locale, "/cart"),
  };
}

export default async function CartPage() {
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const labels: CartLabels = {
    title: dict.cart.title,
    empty: dict.cart.empty,
    emptyHint: dict.cart.emptyHint,
    emptyCta: dict.cart.emptyCta,
    itemCount: dict.cart.itemCount,
    itemCountOne: dict.cart.itemCountOne,
    quantity: dict.cart.quantity,
    lineTotal: dict.cart.lineTotal,
    perBox: dict.common.perBox,
    remove: dict.common.remove,
    removeConfirmTitle: dict.cart.removeConfirmTitle,
    removeConfirmBody: dict.cart.removeConfirmBody,
    cancel: dict.common.cancel,
    clear: dict.common.clear,
    clearConfirmTitle: dict.cart.clearConfirmTitle,
    clearConfirmBody: dict.cart.clearConfirmBody,
    subtotal: dict.cart.subtotal,
    total: dict.cart.total,
    deliveryNote: dict.cart.deliveryNote,
    checkout: dict.cart.checkout,
    continueShopping: dict.common.continueShopping,
    stockChanged: dict.cart.stockChanged,
    stockChangedHint: dict.cart.stockChangedHint,
    maxQuantity: dict.cart.maxQuantity,
    ageNotice: dict.cart.ageNotice,
    ageNoticeBody: dict.cart.ageNoticeBody,
    savedLocally: dict.cart.savedLocally,
    decrease: dict.common.decrease,
    increase: dict.common.increase,
    checkAvailability: dict.cart.checkAvailability,
    availabilityOk: dict.cart.availabilityOk,
    availabilityError: dict.cart.availabilityError,
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[{ label: dict.nav.home, href: href("/") }, { label: dict.cart.title }]}
      />

      <h1 className="mt-4 text-h1 text-foreground">{dict.cart.title}</h1>

      <div className="mt-6">
        <CartView
          labels={labels}
          locale={locale}
          currencyCode={currencyCode}
          shopHref={href("/shop")}
          checkoutHref={href("/checkout")}
          productHrefBase={href("/product")}
        />
      </div>
    </div>
  );
}
