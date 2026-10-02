import { BRAND_CHOICES, COLLECTION_CHOICES } from "@/components/admin/editorOptions";
import { ProductEditor } from "@/components/admin/ProductEditor";
import styles from "@/components/admin/admin.module.css";

export default function AdminNewProductPage() {
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Yeni saat</h1>
      </header>
      <ProductEditor product={null} brands={BRAND_CHOICES} collections={COLLECTION_CHOICES} />
    </>
  );
}
