import { promises as fs } from "node:fs";

import { getAdminOrNull } from "@/lib/admin/guard";
import { ImageRejectionError, MAX_UPLOAD_BYTES, processProductImage } from "@/lib/images/process";
import { formatByteLimit } from "@/lib/images/limits";
import {
  ensureImageDirectory,
  getImageEntry,
  imageFilePath,
  saveImageEntry,
} from "@/lib/images/store";

/**
 * Upload or replace a product image (admin only).
 *
 * A Route Handler rather than a Server Action: Server Action bodies are
 * size-limited by the framework, and this endpoint exists to accept
 * multi-megabyte files.
 *
 * Security: authenticated → size-capped → magic-byte checked → decoded and
 * re-encoded by sharp → written under a generated file name. Neither the
 * client's file name nor its content type is trusted.
 */
export async function POST(request: Request) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const productId = Number.parseInt(String(formData.get("productId") ?? ""), 10);
  if (!Number.isInteger(productId) || productId <= 0) {
    return Response.json({ ok: false, error: "invalid_product" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  let processed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    processed = await processProductImage(buffer, productId);
  } catch (error) {
    if (error instanceof ImageRejectionError) {
      return Response.json(
        { ok: false, error: error.reason, limit: formatByteLimit(MAX_UPLOAD_BYTES) },
        { status: 400 },
      );
    }
    console.error("[admin] image processing failed", error);
    return Response.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }

  try {
    await ensureImageDirectory();

    const previous = await getImageEntry(productId);

    await fs.writeFile(imageFilePath(processed.fileName), processed.data);

    await saveImageEntry({
      productId,
      file: processed.fileName,
      mime: processed.mime,
      width: processed.width,
      height: processed.height,
      bytes: processed.bytes,
      hash: processed.hash,
      blurDataURL: processed.blurDataURL || undefined,
      updatedAt: new Date().toISOString(),
    });

    // Remove the superseded file so replacements do not accumulate.
    if (previous && previous.file !== processed.fileName) {
      try {
        await fs.unlink(imageFilePath(previous.file));
      } catch {
        /* already gone */
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin] failed to store image", error);
    return Response.json({ ok: false, error: "storage_failed" }, { status: 500 });
  }
}
