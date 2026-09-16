"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getBoundaryMessages } from "@/lib/i18n/boundary";
import { localePath } from "@/lib/i18n/routes";

/**
 * Segment error boundary.
 *
 * Uses the boundary message set (not the full catalogue) so the client bundle
 * stays small. The technical error is logged to the server console rather than
 * shown to the customer.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const messages = getBoundaryMessages(pathname);
  const locale = pathname.split("/")[1] || "en";

  useEffect(() => {
    console.error("[ui] unhandled error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={<AlertTriangle className="size-6" />}
          title={messages.errorTitle}
          description={messages.errorBody}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset}>{messages.retry}</Button>
              <a
                href={localePath(locale as "en" | "pt", "/")}
                className={buttonVariants({ variant: "outline" })}
              >
                {messages.goHome}
              </a>
            </div>
          }
        />
        {error.digest ? (
          <p className="mt-4 text-center text-caption text-muted-foreground">
            {messages.errorTitle} · {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
