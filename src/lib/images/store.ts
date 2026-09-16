import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Product image mapping.
 *
 * Uploaded images are associated with a product **by product id** (the brief's
 * preferred key) and recorded in a small JSON file next to the files themselves.
 * Nothing is written back to the POS — the POS keeps owning the product record
 * and its own Cloudinary image; this mapping simply takes precedence when an
 * image has been uploaded here.
 *
 * Location: `<project>/data/` (gitignored, runtime data — back it up on the
 * server alongside the database).
 */

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGE_DIR = path.join(DATA_DIR, "product-images");
const MAPPING_FILE = path.join(DATA_DIR, "product-images.json");

export interface ImageMappingEntry {
  productId: number;
  /** File name inside `data/product-images`. Never user-supplied. */
  file: string;
  mime: string;
  width: number;
  height: number;
  bytes: number;
  /** Content hash — part of the public URL, so replacing an image busts caches. */
  hash: string;
  /** Tiny inline preview for `next/image` while the real file loads. */
  blurDataURL?: string;
  updatedAt: string;
}

export type ImageMapping = Record<string, ImageMappingEntry>;

let cached: { mapping: ImageMapping; mtimeMs: number } | null = null;

function toEntry(value: unknown): ImageMappingEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const entry = value as Record<string, unknown>;

  if (
    typeof entry.productId !== "number" ||
    typeof entry.file !== "string" ||
    typeof entry.hash !== "string" ||
    typeof entry.width !== "number" ||
    typeof entry.height !== "number"
  ) {
    return null;
  }

  // A mapping entry can only ever point at a plain file name; anything with a
  // path separator is discarded rather than trusted.
  if (entry.file !== path.basename(entry.file)) return null;

  return {
    productId: entry.productId,
    file: entry.file,
    mime: typeof entry.mime === "string" ? entry.mime : "image/webp",
    width: entry.width,
    height: entry.height,
    bytes: typeof entry.bytes === "number" ? entry.bytes : 0,
    hash: entry.hash,
    blurDataURL: typeof entry.blurDataURL === "string" ? entry.blurDataURL : undefined,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date(0).toISOString(),
  };
}

/** Reads the mapping, re-reading only when the file has changed on disk. */
export async function readImageMapping(): Promise<ImageMapping> {
  try {
    const stat = await fs.stat(MAPPING_FILE);
    if (cached && cached.mtimeMs === stat.mtimeMs) return cached.mapping;

    const raw = await fs.readFile(MAPPING_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);

    const mapping: ImageMapping = {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        const entry = toEntry(value);
        if (entry) mapping[key] = entry;
      }
    }

    cached = { mapping, mtimeMs: stat.mtimeMs };
    return mapping;
  } catch {
    // No mapping yet (or unreadable) — every product falls back to the API image.
    return {};
  }
}

async function writeImageMapping(mapping: ImageMapping): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Atomic write: a reader never sees a half-written JSON document.
  const temp = `${MAPPING_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");
  await fs.rename(temp, MAPPING_FILE);

  cached = null;
}

export async function getImageEntry(productId: number): Promise<ImageMappingEntry | null> {
  const mapping = await readImageMapping();
  return mapping[String(productId)] ?? null;
}

export async function saveImageEntry(entry: ImageMappingEntry): Promise<void> {
  const mapping = await readImageMapping();
  mapping[String(entry.productId)] = entry;
  await writeImageMapping(mapping);
}

export async function removeImageEntry(productId: number): Promise<ImageMappingEntry | null> {
  const mapping = await readImageMapping();
  const existing = mapping[String(productId)] ?? null;
  if (!existing) return null;

  delete mapping[String(productId)];
  await writeImageMapping(mapping);

  // Best-effort file cleanup; a leftover file is harmless.
  try {
    await fs.unlink(imageFilePath(existing.file));
  } catch {
    /* already gone */
  }

  return existing;
}

export function imageDirectory(): string {
  return IMAGE_DIR;
}

/**
 * Resolves an image file path, refusing anything that escapes the image
 * directory (defence in depth against path traversal).
 */
export function imageFilePath(fileName: string): string {
  const resolved = path.resolve(IMAGE_DIR, path.basename(fileName));
  if (resolved !== path.join(IMAGE_DIR, path.basename(fileName))) {
    throw new Error("Invalid image path");
  }
  return resolved;
}

/** Public URL for an uploaded image. The hash makes replacements cache-busting. */
export function imagePublicUrl(entry: Pick<ImageMappingEntry, "productId" | "hash">): string {
  return `/api/images/${entry.productId}/${entry.hash}`;
}

export async function ensureImageDirectory(): Promise<void> {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
}
