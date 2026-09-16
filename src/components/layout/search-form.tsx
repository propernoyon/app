import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Search is a plain HTML GET form — no JavaScript, no request while typing.
 * Submitting navigates to the shop with `?q=`, where the server queries the POS
 * (`products.php` matches name, SKU and barcode). Live filtering on the shop
 * page adds debounced updates on top of this, so it still works without JS.
 */
export function SearchForm({
  action,
  label,
  placeholder,
  defaultValue,
  autoFocus = false,
  className,
  inputClassName,
}: {
  action: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <form action={action} method="get" role="search" className={cn("group relative", className)}>
      <label htmlFor={`search-${action}`} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id={`search-${action}`}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        // Only mounted when the user explicitly opened the search drawer.
        autoFocus={autoFocus}
        className={cn(
          "h-11 w-full rounded-full border border-border bg-surface pr-3 pl-9 text-small text-foreground",
          "placeholder:text-muted-foreground hover:border-border-strong focus:border-primary",
          "transition-[border-color,background-color] duration-150",
          inputClassName,
        )}
      />
    </form>
  );
}
