import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Brand lockup: the store logo mark plus the store name. The mark is served
 * through `next/image` so it is resized and re-encoded per device density
 * instead of shipping the 727px source to every visitor.
 */
export function Logo({
  name,
  href,
  className,
  showName = true,
  eager = false,
}: {
  name: string;
  href: string;
  className?: string;
  showName?: boolean;
  eager?: boolean;
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
        className="relative size-9 shrink-0 overflow-hidden rounded-lg shadow-xs sm:size-10"
      >
        <Image
          src="/images/logo.png"
          alt=""
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(min-width: 640px) 40px, 36px"
          className="object-cover"
        />
      </span>
      {showName ? (
        <span className="truncate text-h4 leading-none font-bold tracking-tight text-foreground">
          {name}
        </span>
      ) : null}
    </Link>
  );
}
