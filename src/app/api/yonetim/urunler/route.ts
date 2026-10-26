import { revalidateTag } from "next/cache";
import { adminCatalog } from "@/lib/admin/catalogStore";
import { adminRoute } from "@/lib/admin/route";
import { InvalidInput, validateProduct } from "@/lib/admin/store";
import { CATALOG_TAG, catalogSource } from "@/lib/catalog/source";

/**
 * Watches from the panel. With CATALOG_SOURCE=json they are written to
 * products.json (development only); with db, to the database (also on the
 * live site). Only after a write has succeeded is the cached catalogue
 * expired, so the next visitor sees the change; a refused or failed request
 * leaves the cache alone.
 */
const options = { files: () => catalogSource() === "json" };

const expireCatalog = () => revalidateTag(CATALOG_TAG, { expire: 0 });

/** Save a watch (insert or replace). Body: { product, previous? } */
export const PUT = adminRoute(async (request) => {
  const body = (await request.json()) as { product: Record<string, unknown>; previous?: string };
  const product = validateProduct(body.product ?? {});
  await adminCatalog().save(product, body.previous);
  expireCatalog();
  return { slug: product.slug };
}, options);

/** Delete a watch: removed from products.json, or retired in the database. */
export const DELETE = adminRoute(async (request) => {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) throw new InvalidInput("Saat belirtilmedi.");
  await adminCatalog().remove(slug);
  expireCatalog();
  return {};
}, options);
