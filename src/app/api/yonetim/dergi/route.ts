import { adminRoute } from "@/lib/admin/route";
import { deleteArticle, InvalidInput, saveArticle, validateArticle } from "@/lib/admin/store";

/** Save an article (insert or replace). Body: { article, previous? } */
export const PUT = adminRoute(async (request) => {
  const body = (await request.json()) as { article: Record<string, unknown>; previous?: string };
  const article = validateArticle(body.article ?? {});
  await saveArticle(article, body.previous);
  return { slug: article.slug };
});

export const DELETE = adminRoute(async (request) => {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) throw new InvalidInput("Yazı belirtilmedi.");
  await deleteArticle(slug);
  return {};
});
