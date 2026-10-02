import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { BRAND_CHOICES, productChoices } from "@/components/admin/editorOptions";
import { readProducts } from "@/lib/admin/store";
import styles from "@/components/admin/admin.module.css";

export default async function AdminNewArticlePage() {
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Yeni yazı</h1>
      </header>
      <ArticleEditor article={null} brands={BRAND_CHOICES} products={productChoices(await readProducts())} />
    </>
  );
}
