import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Consistent section header with an optional "view all" affordance. */
export function SectionHeading({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-h2 text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-small text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-primary underline-offset-4 hover:underline"
        >
          {actionLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
