import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CheckoutForm, type CheckoutLabels } from "@/components/checkout/checkout-form";
import { buildAlternates } from "@/lib/seo/metadata";
import { getStoreContext } from "@/lib/store/context";

export async function generateMetadata(): Promise<Metadata> {
  const { dict, locale } = await getStoreContext();
  return {
    title: dict.checkout.title,
    robots: { index: false, follow: false },
    alternates: buildAlternates(locale, "/checkout"),
  };
}

export default async function CheckoutPage() {
  const { dict, href, locale, currencyCode } = await getStoreContext();

  const labels: CheckoutLabels = {
    title: dict.checkout.title,
    stepCustomer: dict.checkout.steps.customer,
    stepFulfilment: dict.checkout.steps.fulfilment,
    stepReview: dict.checkout.steps.review,
    customerTitle: dict.checkout.customerTitle,
    customerSubtitle: dict.checkout.customerSubtitle,
    fullName: dict.checkout.fullName,
    fullNamePlaceholder: dict.checkout.fullNamePlaceholder,
    phone: dict.checkout.phone,
    phonePlaceholder: dict.checkout.phonePlaceholder,
    email: dict.checkout.email,
    emailPlaceholder: dict.checkout.emailPlaceholder,
    emailHint: dict.checkout.emailHint,
    optional: dict.common.optional,
    fulfilmentTitle: dict.checkout.fulfilmentTitle,
    fulfilmentSubtitle: dict.checkout.fulfilmentSubtitle,
    delivery: dict.checkout.delivery,
    pickup: dict.checkout.pickup,
    deliveryHint: dict.checkout.deliveryHint,
    pickupHint: dict.checkout.pickupHint,
    deliveryAddress: dict.checkout.deliveryAddress,
    deliveryAddressPlaceholder: dict.checkout.deliveryAddressPlaceholder,
    note: dict.checkout.note,
    noteHint: dict.checkout.noteHint,
    paymentMethod: dict.checkout.paymentMethod,
    paymentNote: dict.checkout.paymentNote,
    paymentCash: dict.checkout.paymentMethods.cash,
    paymentBank: dict.checkout.paymentMethods.bank,
    paymentMobile: dict.checkout.paymentMethods.mobile,
    paymentCredit: dict.checkout.paymentMethods.credit,
    reviewTitle: dict.checkout.reviewTitle,
    reviewSubtitle: dict.checkout.reviewSubtitle,
    orderSummary: dict.checkout.orderSummary,
    placeOrder: dict.checkout.placeOrder,
    placing: dict.checkout.placing,
    backToCart: dict.checkout.backToCart,
    back: dict.common.back,
    next: dict.common.next,
    edit: dict.checkout.editStep,
    required: dict.checkout.required,
    invalidEmail: dict.checkout.invalidEmail,
    invalidPhone: dict.checkout.invalidPhone,
    agreeAge: dict.checkout.agreeAge,
    agreeAgeRequired: dict.checkout.agreeAgeRequired,
    stockWarning: dict.checkout.stockWarning,
    stockWarningHint: dict.checkout.stockWarningHint,
    fixCart: dict.checkout.fixCart,
    errorTitle: dict.checkout.errorTitle,
    errorBody: dict.checkout.errorBody,
    emptyRedirect: dict.checkout.emptyRedirect,
    continueShopping: dict.common.continueShopping,
    subtotal: dict.cart.subtotal,
    total: dict.cart.total,
    onlyAvailable: dict.cart.maxQuantity,
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        items={[
          { label: dict.nav.home, href: href("/") },
          { label: dict.cart.title, href: href("/cart") },
          { label: dict.checkout.title },
        ]}
      />

      <h1 className="mt-4 text-h1 text-foreground">{dict.checkout.title}</h1>

      <div className="mt-6">
        <CheckoutForm
          labels={labels}
          locale={locale}
          currencyCode={currencyCode}
          cartHref={href("/cart")}
          shopHref={href("/shop")}
        />
      </div>
    </div>
  );
}
