"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

/**
 * Re-runs the current route's Server Components.
 *
 * Because API failures are handled as data (see `lib/api/load.ts`), a failed
 * fetch is not caught by `error.tsx` — this button is the retry affordance for
 * that path.
 */
export function RefreshButton({
  label,
  variant = "primary",
  size = "md",
}: {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size={size}
      loading={isPending}
      leadingIcon={<RefreshCw aria-hidden="true" className="size-4" />}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      {label}
    </Button>
  );
}
