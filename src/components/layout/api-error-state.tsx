import { AlertTriangle, WifiOff } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import type { PosApiError } from "@/lib/api/errors";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { apiErrorMessage } from "@/lib/i18n/messages";

/**
 * Friendly, localized state for an API failure.
 *
 * Technical detail stays in the server logs; the customer sees a plain sentence
 * and a retry. `variant="page"` is used when the whole page failed, `inline`
 * when only a section degraded.
 */
export function ApiErrorState({
  error,
  dict,
  title,
  retrySlot,
  variant = "page",
}: {
  error: PosApiError;
  dict: Dictionary;
  title?: string;
  retrySlot?: React.ReactNode;
  variant?: "page" | "inline";
}) {
  const message = apiErrorMessage(dict, error.kind);
  const heading = title ?? dict.errors.genericTitle;

  if (variant === "inline") {
    return (
      <Alert variant="warning" title={heading}>
        <p>{message}</p>
        {retrySlot ? <div className="mt-3">{retrySlot}</div> : null}
      </Alert>
    );
  }

  const OfflineIcon =
    error.kind === "network" || error.kind === "timeout" ? WifiOff : AlertTriangle;

  return (
    <EmptyState
      icon={<OfflineIcon className="size-6" />}
      title={heading}
      description={message}
      action={retrySlot}
    />
  );
}
