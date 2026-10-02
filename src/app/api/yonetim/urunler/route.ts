import { adminRoute } from "@/lib/admin/route";
import { deleteProduct, InvalidInput, saveProduct, validateProduct } from "@/lib/admin/store";

/** Save a watch (insert or replace). Body: { product, previous? } */
export const PUT = adminRoute(async (request) => {
  const body = (await request.json()) as { product: Record<string, unknown>; previous?: string };
  const product = validateProduct(body.product ?? {});
  await saveProduct(product, body.previous);
  return { slug: product.slug };
});

export const DELETE = adminRoute(async (request) => {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) throw new InvalidInput("Saat belirtilmedi.");
  await deleteProduct(slug);
  return {};
});
