"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinksStacked, type NavItem } from "./nav-links";
import { SearchForm } from "./search-form";
import { ThemeToggle, type ThemeLabels } from "./theme-toggle";

export interface MobileCategory {
  name: string;
  slug: string;
  href: string;
  productCount: number;
}

/**
 * Mobile navigation drawer.
 *
 * Contains the full search form (so searching is one tap from the menu), the
 * primary links, every category, and — importantly — the language and theme
 * controls, which the desktop header hides below `sm`. Uses the shared
 * native-`<dialog>` shell for focus trapping and Esc handling.
 */
export function MobileNav({
  navItems,
  categories,
  sectionsLabel,
  searchAction,
  searchLabel,
  searchPlaceholder,
  menuLabel,
  closeLabel,
  preferencesLabel,
  languageLabel,
  themeLabels,
  locale,
}: {
  navItems: NavItem[];
  categories: MobileCategory[];
  sectionsLabel: string;
  searchAction: string;
  searchLabel: string;
  searchPlaceholder: string;
  menuLabel: string;
  closeLabel: string;
  preferencesLabel: string;
  languageLabel: string;
  themeLabels: ThemeLabels;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <Modal
        open={open}
        onClose={close}
        variant="drawer-right"
        title={menuLabel}
        closeLabel={closeLabel}
      >
        <div className="space-y-6">
          <SearchForm
            action={searchAction}
            label={searchLabel}
            placeholder={searchPlaceholder}
            autoFocus
          />

          <nav aria-label={menuLabel}>
            <NavLinksStacked items={navItems} onNavigate={close} />
          </nav>

          {categories.length > 0 ? (
            <div>
              <h3 className="px-3 text-micro text-muted-foreground">{sectionsLabel}</h3>
              <ul className="mt-2 space-y-0.5">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={category.href}
                      onClick={close}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-small text-foreground transition-colors hover:bg-muted"
                    >
                      <span className="truncate">{category.name}</span>
                      <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                        {category.productCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Language and theme live here on phones: the header cannot fit them
              below `sm`, and a mobile visitor must be able to switch both. */}
          <div className="border-t border-border pt-5">
            <h3 className="px-3 text-micro text-muted-foreground">{preferencesLabel}</h3>
            <div className="mt-3 space-y-3">
              <LanguageSwitcher
                locale={locale}
                label={languageLabel}
                variant="full"
                className="w-full"
              />
              <ThemeToggle labels={themeLabels} variant="segmented" />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Mobile shortcut that sends the customer to the shop, where search is live. */
export function MobileSearchLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted md:hidden"
    >
      <Search aria-hidden="true" className="size-5" />
    </Link>
  );
}
