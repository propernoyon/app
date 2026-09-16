import "server-only";

import { createHash } from "node:crypto";
import sharp, { type OutputInfo, type Sharp } from "sharp";

import { DEFAULT_MAX_UPLOAD_BYTES } from "./limits";

/* ────────────────────────────────────────────────────────────────────────────
 * Upload processing.
 *
 * Defence in depth for an endpoint that accepts files from a browser:
 *   1. a size cap, checked before any decoding work
 *   2. a magic-byte sniff, so an executable renamed to `.jpg` is rejected early
 *   3. a real decode through sharp, which is the authoritative check
 *   4. re-encoding to WebP, which discards EXIF, ICC and any embedded payload
 *   5. a generated file name — user input never reaches the filesystem
 * ──────────────────────────────────────────────────────────────────────────── */

export const MAX_UPLOAD_BYTES = Number.parseInt(
  process.env.IMAGE_UPLOAD_MAX_BYTES ?? String(DEFAULT_MAX_UPLOAD_BYTES),
  10,
);

/** Longest edge of a stored image. Enough for a 2× retina product tile. */
const MAX_EDGE = 1200;
const WEBP_QUALITY = 82;

export type ImageRejectionReason = "too_large" | "unsupported_type" | "unreadable" | "empty";

export class ImageRejectionError extends Error {
  readonly reason: ImageRejectionReason;

  constructor(reason: ImageRejectionReason, message: string) {
    super(message);
    this.name = "ImageRejectionError";
    this.reason = reason;
  }
}

export interface ProcessedImage {
  data: Buffer;
  mime: "image/webp";
  width: number;
  height: number;
  bytes: number;
  hash: string;
  /** `data:` URL of a ~20px preview, for `next/image` blur placeholders. */
  blurDataURL: string;
  /** Safe, generated file name: `p{id}-{hash}.webp`. */
  fileName: string;
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // GIF
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return "image/gif";
  // RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  // ISO-BMFF (AVIF / HEIC): "....ftyp<brand>"
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand.startsWith("heic") || brand.startsWith("heix")) return "image/heic";
  }

  return null;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

/**
 * Validates and re-encodes an uploaded image.
 *
 * @throws ImageRejectionError when the file is too large, not an image, or cannot
 * be decoded.
 */
export async function processProductImage(
  input: Buffer,
  productId: number,
): Promise<ProcessedImage> {
  if (input.length === 0) {
    throw new ImageRejectionError("empty", "The uploaded file is empty.");
  }

  if (input.length > MAX_UPLOAD_BYTES) {
    throw new ImageRejectionError("too_large", `File exceeds the ${MAX_UPLOAD_BYTES} byte limit.`);
  }

  const sniffed = sniffMime(input);
  if (!sniffed || !ALLOWED.has(sniffed)) {
    throw new ImageRejectionError(
      "unsupported_type",
      "Only JPEG, PNG, WebP, AVIF and GIF images are accepted.",
    );
  }

  let pipeline: Sharp;
  try {
    const image = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new ImageRejectionError("unreadable", "The image has no usable dimensions.");
    }
    // rotate() with no argument applies the EXIF orientation before it is stripped.
    pipeline = image.rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
  } catch (error) {
    if (error instanceof ImageRejectionError) throw error;
    throw new ImageRejectionError("unreadable", "The file could not be decoded as an image.");
  }

  let data: Buffer;
  let info: OutputInfo;
  try {
    const result = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    info = result.info;
  } catch {
    throw new ImageRejectionError("unreadable", "The image could not be converted.");
  }

  const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);

  // A 20px wide preview is a few hundred bytes and gives a real blur-up.
  let blurDataURL = "";
  try {
    const blur = await sharp(data)
      .resize({ width: 20, height: 20, fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();
    blurDataURL = `data:image/webp;base64,${blur.toString("base64")}`;
  } catch {
    blurDataURL = "";
  }

  return {
    data,
    mime: "image/webp",
    width: info.width,
    height: info.height,
    bytes: info.size,
    hash,
    blurDataURL,
    // Generated from validated integers only.
    fileName: `p${Math.trunc(productId)}-${hash}.webp`,
  };
}
