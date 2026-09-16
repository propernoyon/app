import Link from "next/link";
import { ImageOff, LogOut, Search } from "lucide-react";

import { adminLogoutAction } from "@/app/actions/admin";
import {
  ImageManager,
  type AdminImageItem,
  type AdminImageLabels,
} from "@/components/admin/image-manager";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getAdminContext } from "@/lib/admin/locale";
import { requireAdmin } from "@/lib/admin/guard";
import { tryLoad } from "@/lib/api/load";
import { listProducts } from "@/lib/api/products";
import { formatDate } from "@/lib/i18n/formats";
import { readImageMapping } from "@/lib/images/store";
import { DEFAULT_MAX_UPLOAD_BYTES, formatByteLimit } from "@/lib/images/limits";
import { MAX_UPLOAD_BYTES } from "@/lib/images/process";
import type { ImageSource } from "@/lib/domain/product";
import { firstParam } from "@/lib/utils/params";

const PER_PAGE = 12;

export const metadata = {
  title: "Image management · Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin image management.
 *
 * Deliberately narrow: it searches the catalogue, shows which image each product
 * currently resolves to, and lets the operator upload, replace or remove it. It
 * never writes to the POS — that remains the source of truth for product data.
 */
export default async function AdminPage(props: PageProps<"/admin">) {
  const session = await requireAdmin();
  const searchParams = await props.searchParams;
  const { dict, locale } = await getAdminContext();

  const q = firstParam(searchParams.q).trim();
  const page = Math.max(1, Number.parseInt(firstParam(searchParams.page), 10) || 1);

  const [result, mapping] = await Promise.all([
    tryLoad(() => listProducts({ search: q, page, perPage: PER_PAGE })),
    readImageMapping(),
  ]);

  const labels: AdminImageLabels = {
    upload: dict.admin.upload,
    replace: dict.admin.replace,
    remove: dict.admin.remove,
    uploading: dict.admin.uploading,
    uploadSuccess: dict.admin.uploadSuccess,
    removeSuccess: dict.admin.removeSuccess,
    uploadError: dict.admin.uploadError,
    fileTooLarge: dict.admin.fileTooLarge,
    fileTypeInvalid: dict.admin.fileTypeInvalid,
    imageUnreadable: dict.admin.imageUnreadable,
    removeConfirmTitle: dict.admin.removeConfirmTitle,
    removeConfirmBody: dict.admin.removeConfirmBody,
    cancel: dict.common.cancel,
    uploadedOn: dict.admin.uploadedOn,
  };

  const sourceLabels: Record<ImageSource, string> = {
    uploaded: dict.admin.imageSource.uploaded,
    api: dict.admin.imageSource.api,
    placeholder: dict.admin.imageSource.placeholder,
  };

  const items: AdminImageItem[] =
    result.ok && result.data.products.length > 0
      ? result.data.products.map((product) => {
          const entry = mapping[String(product.id)];
          return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            categoryName: product.category?.name ?? null,
            imageUrl: product.image.url,
            imageSource: product.image.source,
            uploadedAtLabel: entry
              ? formatDate(entry.updatedAt, locale, { dateStyle: "medium" })
              : null,
          };
        })
      : [];

  return (
    <main className="container-page flex-1 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2 text-foreground">{dict.admin.title}</h1>
          <p className="mt-1 max-w-2xl text-small text-muted-foreground">{dict.admin.subtitle}</p>
          <p className="mt-1 text-caption text-muted-foreground">{session.email}</p>
        </div>

        <form action={adminLogoutAction}>
          <Button
            type="submit"
            variant="outline"
            leadingIcon={<LogOut aria-hidden="true" className="size-4" />}
          >
            {dict.admin.signOut}
          </Button>
        </form>
      </header>

      <Card className="mt-6">
        <CardBody>
          <form
            action="/admin"
            method="get"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <label htmlFor="admin-search" className="sr-only">
                {dict.admin.searchLabel}
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="admin-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder={dict.admin.searchPlaceholder}
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-input bg-surface pr-3 pl-9 text-foreground placeholder:text-muted-foreground hover:border-border-strong focus:border-primary"
              />
            </div>
            <Button type="submit" size="lg">
              {dict.admin.searchLabel}
            </Button>
          </form>

          <p className="mt-2 text-caption text-muted-foreground">{dict.admin.searchHint}</p>
        </CardBody>
      </Card>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-small text-muted-foreground">
          {result.ok
            ? dict.admin.resultCount.replace("{count}", String(result.data.pagination.total))
            : ""}
        </p>
        <p className="text-caption text-muted-foreground">
          {dict.admin.fileTooLarge.replace(
            "{limit}",
            formatByteLimit(MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES),
          )}
        </p>
      </div>

      <div className="mt-4">
        {!result.ok ? (
          <Alert variant="warning" title={dict.admin.uploadError}>
            <p>{dict.errors.server}</p>
          </Alert>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ImageOff className="size-6" />}
            title={q ? dict.admin.searchEmpty : dict.shop.empty}
            description={dict.admin.searchHint}
            action={
              <Link
                href="/admin"
                className="text-small font-semibold text-primary underline-offset-4 hover:underline"
              >
                {dict.shop.clearFilters}
              </Link>
            }
          />
        ) : (
          <ImageManager
            items={items}
            labels={labels}
            sourceLabels={sourceLabels}
            maxBytes={MAX_UPLOAD_BYTES}
            limitLabel={formatByteLimit(MAX_UPLOAD_BYTES)}
          />
        )}
      </div>

      {result.ok ? (
        <Pagination
          className="mt-8"
          currentPage={result.data.pagination.page}
          totalPages={result.data.pagination.pages}
          basePath="/admin"
          query={{ q: q || undefined }}
          labels={{
            previous: dict.common.previous,
            next: dict.common.next,
            page: dict.common.pagination,
          }}
        />
      ) : null}
    </main>
  );
}
