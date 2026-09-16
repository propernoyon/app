"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUp, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ACCEPT_ATTRIBUTE, isAcceptedImageType } from "@/lib/images/limits";
import type { ImageSource } from "@/lib/domain/product";

export interface AdminImageLabels {
  upload: string;
  replace: string;
  remove: string;
  uploading: string;
  uploadSuccess: string;
  removeSuccess: string;
  uploadError: string;
  fileTooLarge: string;
  fileTypeInvalid: string;
  imageUnreadable: string;
  removeConfirmTitle: string;
  removeConfirmBody: string;
  cancel: string;
  uploadedOn: string;
}

export interface AdminImageItem {
  productId: number;
  name: string;
  sku: string | null;
  categoryName: string | null;
  imageUrl: string;
  imageSource: ImageSource;
  /** Pre-formatted on the server, so the client needs no locale data. */
  uploadedAtLabel: string | null;
}

const SOURCE_VARIANT: Record<ImageSource, "success" | "info" | "neutral"> = {
  uploaded: "success",
  api: "info",
  placeholder: "neutral",
};

/**
 * Image management list.
 *
 * Each row is independent, so an upload on one product never blocks another.
 * Files are validated in the browser for instant feedback and again on the
 * server — which is the only validation that actually matters.
 */
export function ImageManager({
  items,
  labels,
  sourceLabels,
  maxBytes,
  limitLabel,
}: {
  items: AdminImageItem[];
  labels: AdminImageLabels;
  sourceLabels: Record<ImageSource, string>;
  /** Configured limit, passed from the server so client and server agree. */
  maxBytes: number;
  limitLabel: string;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.productId}>
          <ImageRow
            item={item}
            labels={labels}
            sourceLabels={sourceLabels}
            maxBytes={maxBytes}
            limitLabel={limitLabel}
          />
        </li>
      ))}
    </ul>
  );
}

function ImageRow({
  item,
  labels,
  sourceLabels,
  maxBytes,
  limitLabel,
}: {
  item: AdminImageItem;
  labels: AdminImageLabels;
  sourceLabels: Record<ImageSource, string>;
  maxBytes: number;
  limitLabel: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function failureMessage(error: string, limit?: string): string {
    if (error === "too_large") return labels.fileTooLarge.replace("{limit}", limit ?? limitLabel);
    if (error === "unsupported_type") return labels.fileTypeInvalid;
    if (error === "unreadable" || error === "empty") return labels.imageUnreadable;
    return labels.uploadError;
  }

  async function upload(file: File) {
    if (!isAcceptedImageType(file.type)) {
      toast({ title: labels.fileTypeInvalid, variant: "error" });
      return;
    }
    if (file.size > maxBytes) {
      toast({ title: labels.fileTooLarge.replace("{limit}", limitLabel), variant: "error" });
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("productId", String(item.productId));
      body.append("file", file);

      const response = await fetch("/api/admin/images", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        limit?: string;
      };

      if (!response.ok || !payload.ok) {
        toast({ title: failureMessage(payload.error ?? "", payload.limit), variant: "error" });
        return;
      }

      toast({ title: labels.uploadSuccess, description: item.name, variant: "success" });
      startTransition(() => router.refresh());
    } catch {
      toast({ title: labels.uploadError, variant: "error" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/images/${item.productId}`, { method: "DELETE" });
      if (!response.ok) {
        toast({ title: labels.uploadError, variant: "error" });
        return;
      }
      toast({ title: labels.removeSuccess, description: item.name, variant: "info" });
      startTransition(() => router.refresh());
    } catch {
      toast({ title: labels.uploadError, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const working = busy || isPending;

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="80px"
            className={item.imageSource === "placeholder" ? "object-contain p-2" : "object-cover"}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg font-semibold text-foreground">{item.name}</p>
          <p className="mt-0.5 truncate text-caption text-muted-foreground">
            #{item.productId}
            {item.sku ? ` · ${item.sku}` : ""}
            {item.categoryName ? ` · ${item.categoryName}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={SOURCE_VARIANT[item.imageSource]} size="sm" dot>
              {sourceLabels[item.imageSource]}
            </Badge>
            {item.uploadedAtLabel ? (
              <span className="text-caption text-muted-foreground">
                {labels.uploadedOn.replace("{date}", item.uploadedAtLabel)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />

          <Button
            variant="outline"
            size="sm"
            loading={working}
            disabled={working}
            onClick={() => inputRef.current?.click()}
            leadingIcon={
              item.imageSource === "uploaded" ? (
                <ImageUp aria-hidden="true" className="size-4" />
              ) : (
                <Upload aria-hidden="true" className="size-4" />
              )
            }
          >
            {working
              ? labels.uploading
              : item.imageSource === "uploaded"
                ? labels.replace
                : labels.upload}
          </Button>

          {item.imageSource === "uploaded" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={working}
              onClick={() => setConfirmRemove(true)}
              aria-label={`${labels.remove}: ${item.name}`}
            >
              <Trash2 aria-hidden="true" className="size-4 text-danger" />
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={labels.removeConfirmTitle}
        description={labels.removeConfirmBody}
        confirmLabel={labels.remove}
        cancelLabel={labels.cancel}
        destructive
        onConfirm={() => void remove()}
      />
    </Card>
  );
}
