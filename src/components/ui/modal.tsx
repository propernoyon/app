"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** `dialog` is centred; the drawer variants slide in from an edge. */
  variant?: "dialog" | "drawer-right" | "drawer-bottom";
  closeLabel: string;
  className?: string;
}

/**
 * Built on the native `<dialog>` element so focus trapping, Esc handling,
 * background inerting and focus restoration come from the platform rather than
 * hand-rolled JavaScript.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "dialog",
  closeLabel,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Esc-close fires `close`, which keeps React state in sync.
      onClose={onClose}
      // Backdrop clicks land on the dialog element itself.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "mm-dialog",
        variant === "dialog" && "mm-dialog-center",
        variant === "drawer-right" && "mm-dialog-right",
        variant === "drawer-bottom" && "mm-dialog-bottom",
      )}
    >
      <div
        className={cn(
          "mm-panel flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-pop",
          variant === "dialog" && "max-w-md rounded-2xl",
          variant === "drawer-right" && "h-full max-w-sm sm:rounded-l-2xl",
          variant === "drawer-bottom" && "rounded-t-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-h4 text-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-small text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mt-1 -mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        ) : null}

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  /** Shows in-flight feedback on the confirm button and blocks a second click. */
  confirmLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  confirmLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      closeLabel={cancelLabel}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
