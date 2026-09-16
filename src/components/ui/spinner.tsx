import { cn } from "@/lib/utils/cn";

/**
 * Decorative loading indicator. Always hidden from assistive tech — the
 * surrounding control communicates busy state via `aria-busy`.
 */
export function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin", className)}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
