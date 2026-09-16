"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. `0` keeps it until dismissed. */
  duration?: number;
}

interface ToastRecord extends Required<Omit<ToastInput, "description">> {
  id: number;
  description?: string;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { className: string; Icon: typeof Info }> = {
  success: {
    className: "border-success-border bg-success-muted text-success-foreground",
    Icon: CheckCircle2,
  },
  error: {
    className: "border-danger-border bg-danger-muted text-danger-foreground",
    Icon: XCircle,
  },
  warning: {
    className: "border-warning-border bg-warning-muted text-warning-foreground",
    Icon: TriangleAlert,
  },
  info: { className: "border-info-border bg-info-muted text-info-foreground", Icon: Info },
};

const LEAVE_MS = 160;

export function ToastProvider({
  children,
  closeLabel,
}: {
  children: ReactNode;
  closeLabel: string;
}) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
      );
      const timer = setTimeout(() => remove(id), LEAVE_MS);
      timers.current.set(id, timer);
    },
    [remove],
  );

  const toast = useCallback(
    ({ title, description, variant = "success", duration = 4000 }: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current.slice(-2),
        { id, title, description, variant, duration, leaving: false },
      ]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // Single live region: polite additions, errors announced assertively
        // through the toast's own role.
        aria-live="polite"
        aria-atomic="false"
        // On mobile and tablet the dock is lifted clear of the product page's
        // fixed add-to-cart bar (itself `lg:hidden`), so an "added to cart" toast
        // never covers the control that produced it. The bar publishes its own
        // measured height, because it grows when the box/piece switch wraps.
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mm-action-bar-height,0px)+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-4 sm:items-end sm:p-0 lg:bottom-4"
      >
        {toasts.map((item) => {
          const { className, Icon } = VARIANT_STYLES[item.variant];
          return (
            <div
              key={item.id}
              role={item.variant === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-pop",
                "transition-[opacity,transform] duration-150 ease-[var(--ease-out-soft)]",
                item.leaving
                  ? "translate-y-2 opacity-0"
                  : "animate-[mm-slide-up_180ms_var(--ease-out-soft)]",
                className,
              )}
            >
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-caption opacity-90">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={closeLabel}
                className="-mr-1 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
