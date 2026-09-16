/**
 * Theme preference handling.
 *
 * Three preferences — `light`, `dark` and `system` — persisted in a cookie
 * rather than `localStorage`, for two reasons: it matches how the locale
 * preference is stored (`LOCALE_COOKIE`), and it is available to the blocking
 * bootstrap script below before the first paint, so there is no light/dark
 * flash on load.
 *
 * `THEME_BOOTSTRAP_SCRIPT` is inlined into every root layout. It cannot import
 * anything (it must run as the very first thing in `<body>`), so its logic is
 * deliberately duplicated by `applyTheme` — keep the two in step.
 */

export const THEME_COOKIE = "mm-theme";

export const THEME_PREFS = ["light", "dark", "system"] as const;

export type ThemePref = (typeof THEME_PREFS)[number];

export const DEFAULT_THEME_PREF: ThemePref = "system";

/** One year, matching the locale cookie. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemePref(value: unknown): value is ThemePref {
  return typeof value === "string" && (THEME_PREFS as readonly string[]).includes(value);
}

/**
 * Runs synchronously before the rest of `<body>` is parsed. Reads the cookie,
 * falls back to the system preference, then sets the `dark` class, the
 * `color-scheme` (so native scrollbars and form controls match) and
 * `data-theme-pref` (so the toggle can render its true state without a
 * hydration mismatch).
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k="${THEME_COOKIE}=";var p=null;var parts=document.cookie?document.cookie.split("; "):[];for(var i=0;i<parts.length;i++){if(parts[i].indexOf(k)===0){p=parts[i].slice(k.length);break;}}if(p!=="light"&&p!=="dark"&&p!=="system"){p="system";}var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";e.dataset.themePref=p;}catch(e){}})();`;

/** Whether the OS currently asks for a dark colour scheme. */
export function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Current preference: the value the bootstrap script already published. */
export function readThemePref(): ThemePref {
  if (typeof document === "undefined") return DEFAULT_THEME_PREF;

  const fromDataset = document.documentElement.dataset.themePref;
  if (isThemePref(fromDataset)) return fromDataset;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${THEME_COOKIE}=`));
  const value = match?.slice(THEME_COOKIE.length + 1);
  return isThemePref(value) ? value : DEFAULT_THEME_PREF;
}

export function writeThemePref(pref: ThemePref): void {
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

/** Applies a preference to the document. Mirrors the bootstrap script. */
export function applyTheme(pref: ThemePref): void {
  const dark = pref === "dark" || (pref === "system" && prefersDark());
  const root = document.documentElement;

  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.themePref = pref;
}
