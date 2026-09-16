"use client";

import { useId, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import {
  DEFAULT_THEME_PREF,
  THEME_PREFS,
  applyTheme,
  readThemePref,
  writeThemePref,
  type ThemePref,
} from "@/lib/theme/config";
import { cn } from "@/lib/utils/cn";

export interface ThemeLabels {
  label: string;
  light: string;
  dark: string;
  system: string;
  switchToLight: string;
  switchToDark: string;
  switchToSystem: string;
}

const ICONS: Record<ThemePref, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/** Cycle order for the compact button. */
const NEXT: Record<ThemePref, ThemePref> = {
  light: "dark",
  dark: "system",
  system: "light",
};

/*
 * The theme lives in the DOM (a class on <html>, set by the bootstrap script)
 * rather than in React state, so it is an external store — which is exactly what
 * `useSyncExternalStore` is for. Reading it this way avoids both a hydration
 * mismatch and a setState-in-effect cascade.
 */
let cached: ThemePref | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // The OS preference only affects the resolved theme while set to `system`,
  // but the control must still re-render if that changes.
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    cached = null;
    if (readThemePref() === "system") applyTheme("system");
    emit();
  };
  query.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", onSystemChange);
  };
}

function getSnapshot(): ThemePref {
  if (cached === null) cached = readThemePref();
  return cached;
}

/** Server and first hydration render agree on the documented default. */
function getServerSnapshot(): ThemePref {
  return DEFAULT_THEME_PREF;
}

function setThemePref(next: ThemePref) {
  writeThemePref(next);
  applyTheme(next);
  cached = next;
  emit();
}

/**
 * Theme control.
 *
 * `compact` is a single icon button that cycles light → dark → system, sized for
 * the header. `segmented` shows all three options explicitly, for the mobile
 * drawer and footer where there is room. Both announce the resulting action
 * ("Switch to dark mode") rather than the current state, which is what a screen
 * reader user needs to act on.
 */
export function ThemeToggle({
  labels,
  variant = "segmented",
  className,
}: {
  labels: ThemeLabels;
  variant?: "compact" | "segmented";
  className?: string;
}) {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const groupName = useId();

  const nameOf: Record<ThemePref, string> = {
    light: labels.light,
    dark: labels.dark,
    system: labels.system,
  };
  const switchLabel: Record<ThemePref, string> = {
    light: labels.switchToLight,
    dark: labels.switchToDark,
    system: labels.switchToSystem,
  };

  if (variant === "compact") {
    const next = NEXT[pref];
    const Icon = ICONS[pref];

    return (
      <button
        type="button"
        onClick={() => setThemePref(next)}
        aria-label={switchLabel[next]}
        title={`${labels.label}: ${nameOf[pref]}`}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground",
          "transition-colors duration-150 hover:bg-muted",
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </button>
    );
  }

  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className="sr-only">{labels.label}</legend>
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
        {THEME_PREFS.map((option) => {
          const Icon = ICONS[option];
          const active = pref === option;

          return (
            <label
              key={option}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2",
                "text-caption font-semibold transition-colors duration-150",
                active
                  ? "bg-primary-muted text-primary-strong"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={active}
                onChange={() => setThemePref(option)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{nameOf[option]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
