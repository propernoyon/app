"use client";

import { usePathname } from "next/navigation";
import { PackageSearch } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getBoundaryMessages } from "@/lib/i18n/boundary";
import { localePath } from "@/lib/i18n/routes";

/**
 * 404 screen for the storefront. A Client Component so it can read the locale
 * from the pathname and stay localized without bundling the full catalogue.
 */
export default function LocaleNotFound() {
  const pathname = usePathname();
  const messages = getBoundaryMessages(pathname);
  const locale = pathname.split("/")[1] || "en";

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={<PackageSearch className="size-6" />}
          title={messages.notFoundTitle}
          description={messages.notFoundBody}
          action={
            <a href={localePath(locale as "en" | "pt", "/shop")} className={buttonVariants({})}>
              {messages.browseShop}
            </a>
          }
        />
      </div>
    </div>
  );
}
