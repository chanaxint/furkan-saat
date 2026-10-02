import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { BRAND_CHOICES, productChoices } from "@/components/admin/editorOptions";
import { readArticles, readProducts } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

export default async function AdminArticlePage({ params }: PageProps<"/yonetim/dergi/[slug]">) {
  const { slug } = await params;
  const [articles, products] = await Promise.all([readArticles(), readProducts()]);
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>{article.title}</h1>
      </header>
      <ArticleEditor article={article} brands={BRAND_CHOICES} products={productChoices(products)} />
    </>
  );
}
