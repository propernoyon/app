import Image from "next/image";

import type { ResolvedImage } from "@/lib/domain/product";
import { cn } from "@/lib/utils/cn";

/**
 * Product image with a guaranteed fallback.
 *
 * The wrapper owns the aspect ratio, so the box is reserved before the image
 * loads (no layout shift). Missing, unreadable and slow images all land on the
 * branded placeholder instead of a broken icon — the resolver in
 * `lib/images/placeholder.ts` decides the source; this component only renders it.
 */
export function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className,
  imageClassName,
  aspect = "square",
}: {
  image: ResolvedImage;
  alt: string;
  /** Required `sizes` hint — keeps srcset honest and avoids oversized downloads. */
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  aspect?: "square" | "4/3" | "3/2";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        aspect === "square" && "aspect-square",
        aspect === "4/3" && "aspect-4/3",
        aspect === "3/2" && "aspect-3/2",
        className,
      )}
    >
      <Image
        src={image.url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className={cn(
          "object-cover",
          image.source === "placeholder" && "object-contain p-6",
          imageClassName,
        )}
      />
    </div>
  );
}
