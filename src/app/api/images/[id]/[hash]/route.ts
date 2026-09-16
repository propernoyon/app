import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { Readable } from "node:stream";

import { imageFilePath, readImageMapping } from "@/lib/images/store";

/**
 * Serves an uploaded product image.
 *
 * The hash is part of the path and is verified against the mapping, so the URL
 * is immutable and can be cached aggressively; replacing an image produces a new
 * hash and therefore a new URL, with no cache invalidation needed.
 */
export async function GET(_request: Request, context: RouteContext<"/api/images/[id]/[hash]">) {
  const { id, hash } = await context.params;

  const productId = Number.parseInt(id, 10);
  if (!Number.isInteger(productId) || productId <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const mapping = await readImageMapping();
  const entry = mapping[String(productId)];

  // Unknown product, or a stale hash from a replaced image.
  if (!entry || entry.hash !== hash) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const filePath = imageFilePath(entry.file);
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    const stream = Readable.toWeb(createReadStream(filePath)) as NodeReadableStream<Uint8Array>;

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": entry.mime,
        "Content-Length": String(info.size),
        // Immutable: the URL changes whenever the image changes.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
