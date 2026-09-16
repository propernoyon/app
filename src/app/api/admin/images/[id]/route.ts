import { getAdminOrNull } from "@/lib/admin/guard";
import { removeImageEntry } from "@/lib/images/store";

/**
 * Remove an uploaded image (admin only), reverting the product to the image the
 * POS holds — or the branded placeholder.
 */
export async function DELETE(_request: Request, context: RouteContext<"/api/admin/images/[id]">) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const productId = Number.parseInt(id, 10);
  if (!Number.isInteger(productId) || productId <= 0) {
    return Response.json({ ok: false, error: "invalid_product" }, { status: 400 });
  }

  try {
    const removed = await removeImageEntry(productId);
    if (!removed) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin] failed to remove image", error);
    return Response.json({ ok: false, error: "storage_failed" }, { status: 500 });
  }
}
