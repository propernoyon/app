import { listCategories } from "@/lib/api/categories";
import { storeConfig } from "@/config/store";
import { getStoreContext } from "@/lib/store/context";
import { CartButton } from "./cart-button";
import { CategoryNav } from "./category-nav";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileNav, MobileSearchLink } from "./mobile-nav";
import { NavLinks, type NavItem } from "./nav-links";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "./theme-toggle";

/**
 * Sticky storefront header.
 *
 * A Server Component: it reads the locale/currency context and the (hour-cached)
 * category list on the server, so no category data crosses into the client
 * bundle. Only `MobileNav` is interactive.
 */
export async function Header() {
  const { dict, href, locale } = await getStoreContext();
  const categories = await listCategories().catch(() => []);

  const navItems: NavItem[] = [
    { href: href("/"), label: dict.nav.home },
    { href: href("/shop"), label: dict.nav.shop },
    { href: href("/track-order"), label: dict.nav.trackOrder },
  ];

  const shopHref = href("/shop");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <MobileNav
          navItems={navItems}
          categories={categories.map((category) => ({
            name: category.name,
            slug: category.slug,
            href: href(`/category/${category.slug}`),
            productCount: category.productCount,
          }))}
          sectionsLabel={dict.nav.categories}
          searchAction={shopHref}
          searchLabel={dict.common.search}
          searchPlaceholder={dict.common.searchPlaceholder}
          menuLabel={dict.common.menu}
          closeLabel={dict.common.close}
          preferencesLabel={dict.common.preferences}
          languageLabel={dict.common.language}
          themeLabels={dict.theme}
          locale={locale}
        />

        <Logo name={storeConfig.name} href={href("/")} />

        <nav aria-label={dict.common.menu} className="ml-2 hidden lg:block">
          <NavLinks items={navItems} />
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SearchForm
            action={shopHref}
            label={dict.common.search}
            placeholder={dict.common.searchPlaceholder}
            className="hidden w-56 md:block lg:w-72"
          />
          <MobileSearchLink href={shopHref} label={dict.common.search} />
          <LanguageSwitcher
            locale={locale}
            label={dict.common.language}
            className="hidden sm:inline-flex"
          />
          <ThemeToggle
            labels={dict.theme}
            variant="compact"
            className="hidden sm:inline-flex"
          />
          <CartButton
            href={href("/cart")}
            label={dict.nav.cart}
            itemCountTemplateOne={dict.cart.itemCountOne}
            itemCountTemplateOther={dict.cart.itemCount}
          />
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="hidden border-t border-border lg:block">
          <div className="container-page flex h-12 items-center">
            <CategoryNav
              categories={categories}
              label={dict.nav.categories}
              allLabel={dict.shop.allCategories}
              allHref={shopHref}
              categoryHref={(slug) => href(`/category/${slug}`)}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
