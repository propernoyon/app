import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { getStoreContext } from "@/lib/store/context";

/**
 * Route-level loading state for the storefront.
 *
 * Mirrors the shape of a typical page (heading, filters, product grid) — and the
 * grid uses the exact same column ladder as `ProductGrid`, so nothing reflows
 * when the real products arrive.
 */
export default async function LocaleLoading() {
  const { dict } = await getStoreContext();

  return (
    <div className="container-page py-8 sm:py-10" role="status" aria-live="polite">
      <Skeleton className="h-8 w-56" shape="text" />
      <Skeleton className="mt-3 h-4 w-80" shape="text" />

      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-28 rounded-full" />
        ))}
      </div>

      <div className="mt-8">
        <ProductGridSkeleton count={12} label={dict.common.loadingProducts} />
      </div>
    </div>
  );
}
