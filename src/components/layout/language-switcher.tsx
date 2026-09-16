"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

import {
  LOCALE_COOKIE,
  LOCALE_LABELS,
  LOCALE_SHORT,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { switchLocaleInPathname } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils/cn";

/**
 * Language picker.
 *
 * A native `<select>` is used deliberately: it is fully keyboard accessible, has
 * a large touch target on mobile, and needs no popover primitives. Changing the
 * value records the choice in a cookie (so a later visit to `/` keeps it) and
 * navigates to the same page in the other language.
 *
 * The navigation is deliberately a full document load rather than
 * `router.push`: `locale` is a root param, so a client-side switch re-renders
 * the root layout — which re-creates the inline theme-bootstrap `<script>` and
 * makes React warn that client-rendered scripts never execute. A real navigation
 * leaves the root layout alone and re-runs that script at parse time, so the
 * theme is still applied before the first paint. The cart lives in
 * `localStorage`, so it survives the reload.
 */
export function LanguageSwitcher({
  locale,
  label,
  variant = "short",
  className,
}: {
  locale: Locale;
  label: string;
  /** `short` shows "EN"/"PT" (header); `full` spells the language out (drawer). */
  variant?: "short" | "full";
  className?: string;
}) {
  const pathname = usePathname();

  function onChange(next: string) {
    if (next === locale) return;

    // Not httpOnly: this is a UI preference, not a credential.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;

    window.location.assign(switchLocaleInPathname(pathname, next as Locale));
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Languages
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
      />
      <select
        aria-label={label}
        value={locale}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface",
          "pr-7 pl-8 text-small font-semibold text-foreground",
          "transition-colors duration-150 hover:border-border-strong focus:border-primary",
        )}
      >
        {locales.map((item) => (
          <option key={item} value={item} title={LOCALE_LABELS[item]}>
            {variant === "full" ? LOCALE_LABELS[item] : LOCALE_SHORT[item]}
          </option>
        ))}
      </select>
    </div>
  );
}
