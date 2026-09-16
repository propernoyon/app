import boundaryEn from "@/messages/boundary/en.json";
import boundaryPt from "@/messages/boundary/pt.json";

import { localeFromPathname } from "./routes";

/**
 * Messages for error boundaries.
 *
 * `error.tsx` is a Client Component, so it cannot await the server dictionary.
 * Rather than bundling the entire catalogue into the client for a screen that
 * almost never renders, the handful of strings the boundaries need live in their
 * own tiny files.
 */
export type BoundaryMessages = typeof boundaryEn;

const BY_LOCALE: Record<string, BoundaryMessages> = {
  en: boundaryEn,
  pt: boundaryPt,
};

export function getBoundaryMessages(pathname: string | null | undefined): BoundaryMessages {
  const locale = pathname ? localeFromPathname(pathname) : null;
  return (locale && BY_LOCALE[locale]) || boundaryEn;
}
