import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Brand lockup: a monogram mark plus the store name. Deliberately typographic
 * (no raster logo) so it stays crisp at any size and costs nothing to load.
 */
export function Logo({
  name,
  href,
  className,
  showName = true,
}: {
  name: string;
  href: string;
  className?: string;
  showName?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={name}
      className={cn(
        "group inline-flex min-w-0 items-center gap-2.5 rounded-lg",
        "transition-opacity duration-150 hover:opacity-90",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M4 9.5h16l-1.4 8.2A2.5 2.5 0 0 1 16.13 20H7.87a2.5 2.5 0 0 1-2.47-2.3L4 9.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 19v-5.5m0 0 2.2-2.2M12 13.5 9.8 11.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showName ? (
        <span className="truncate text-h4 leading-none font-bold tracking-tight text-foreground">
          {name}
        </span>
      ) : null}
    </Link>
  );
}
