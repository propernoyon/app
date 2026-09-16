import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminContext } from "@/lib/admin/locale";

/**
 * Admin loading state, mirroring the header + search card + row list of
 * `admin/page.tsx` so the layout doesn't jump on first paint.
 */
export default async function AdminLoading() {
  const { dict } = await getAdminContext();

  return (
    <main className="container-page flex-1 py-8" role="status" aria-live="polite">
      <span className="sr-only">{dict.common.loading}</span>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Skeleton className="h-7 w-52" shape="text" />
          <Skeleton className="mt-3 h-4 w-72" shape="text" />
        </div>
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>

      <Card className="mt-6">
        <CardBody>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-64" shape="text" />
        </CardBody>
      </Card>

      <ul className="mt-4 space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Skeleton className="size-20 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" shape="text" />
                  <Skeleton className="h-3 w-1/3" shape="text" />
                </div>
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
