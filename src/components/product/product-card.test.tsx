import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import en from "@/messages/en.json";
import { ProductCard } from "@/components/product/product-card";
import { ToastProvider } from "@/components/ui/toast";
import { cartActions } from "@/lib/cart/store";
import type { Product } from "@/lib/domain/product";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// `next/image` needs a loader/optimiser that does not exist outside Next; a plain
// <img> keeps these tests focused on the card's own behaviour.
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

const dict = en as Dictionary;

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 7,
    name: "Orange Juice 1L",
    sku: "DRK-001",
    barcode: null,
    description: null,
    category: { id: 2, name: "Drinks", color: "#2f7d4f" },
    sellType: "piece",
    saleUnit: "un",
    purchaseUnit: null,
    piecesPerBox: 1,
    price: 2.35,
    boxPrice: 0,
    taxPercent: 0,
    stock: { qty: 36, boxes: 36, pieces: 36, lowAlert: 6, status: "in_stock" },
    image: { url: "/images/placeholder-product.svg", source: "placeholder" },
    apiImageUrl: null,
    createdAt: null,
    updatedAt: null,
    isAgeRestricted: false,
    ...overrides,
  };
}

function renderCard(product: Product) {
  return render(
    <ToastProvider closeLabel={dict.common.close}>
      <ProductCard
        product={product}
        dict={dict}
        locale="en"
        currencyCode="EUR"
        href={`/en/product/${product.id}`}
        cartHref="/en/cart"
      />
    </ToastProvider>,
  );
}

describe("ProductCard", () => {
  // The cart is a module-level store, so each test starts from a clean basket.
  beforeEach(() => {
    cartActions.reset();
    window.localStorage.clear();
  });

  it("renders the product name, category and price", () => {
    renderCard(makeProduct());

    expect(screen.getByRole("heading", { name: "Orange Juice 1L" })).toBeInTheDocument();
    expect(screen.getByText("Drinks")).toBeInTheDocument();
    // Price is formatted server-side; assert the amount rather than its exact shape.
    expect(screen.getByText(/2[.,]35/)).toBeInTheDocument();
  });

  it("offers an add-to-cart button for an available product", () => {
    renderCard(makeProduct());

    const button = screen.getByRole("button", { name: dict.common.addToCart });
    expect(button).toBeEnabled();
  });

  it("hides add-to-cart and shows the out-of-stock state instead", () => {
    renderCard(
      makeProduct({
        stock: { qty: 0, boxes: 0, pieces: 0, lowAlert: 2, status: "out_of_stock" },
      }),
    );

    expect(screen.queryByRole("button", { name: dict.common.addToCart })).not.toBeInTheDocument();

    // The stock badge and the disabled control both use the out-of-stock wording.
    const outOfStock = screen.getAllByText(dict.product.outOfStock);
    expect(outOfStock.length).toBeGreaterThan(0);
  });

  it("marks a low-stock product", () => {
    renderCard(
      makeProduct({
        stock: { qty: 3, boxes: 3, pieces: 3, lowAlert: 6, status: "low_stock" },
      }),
    );

    expect(screen.getByText(dict.product.stock.lowStock)).toBeInTheDocument();
  });

  it("flags an age-restricted product", () => {
    renderCard(makeProduct({ isAgeRestricted: true }));

    expect(screen.getByText(dict.age.badge)).toBeInTheDocument();
  });

  it("links to the product page", () => {
    renderCard(makeProduct());

    const links = screen.getAllByRole("link", { name: "Orange Juice 1L" });
    expect(links[0]).toHaveAttribute("href", "/en/product/7");
  });

  it("swaps the add button for quantity controls once the item is in the basket", async () => {
    const user = userEvent.setup();
    renderCard(makeProduct());

    await user.click(screen.getByRole("button", { name: dict.common.addToCart }));

    // The add button is replaced by a stepper, and a confirmation toast appears.
    expect(screen.queryByRole("button", { name: dict.common.addToCart })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.common.increase })).toBeInTheDocument();
    expect(await screen.findByText(dict.common.addedToCart)).toBeInTheDocument();
  });

  it("persists the line so the basket survives a reload", async () => {
    const user = userEvent.setup();
    renderCard(makeProduct());

    await user.click(screen.getByRole("button", { name: dict.common.addToCart }));

    expect(window.localStorage.getItem("mini-mercado:cart")).toContain("Orange Juice 1L");
  });

  it("increases the quantity from the stepper", async () => {
    const user = userEvent.setup();
    renderCard(makeProduct());

    await user.click(screen.getByRole("button", { name: dict.common.addToCart }));
    await user.click(screen.getByRole("button", { name: dict.common.increase }));

    expect(screen.getByRole("textbox", { name: dict.common.quantity })).toHaveValue("2");
  });
});
