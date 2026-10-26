import { notFound } from "next/navigation";
import { BRAND_CHOICES, COLLECTION_CHOICES } from "@/components/admin/editorOptions";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { requireAdmin } from "@/lib/admin/auth";
import { isCatalogEditable } from "@/lib/admin/catalogStore";
import styles from "@/components/admin/admin.module.css";

export default async function AdminNewProductPage() {
  await requireAdmin("/yonetim/urunler/yeni");
  if (!isCatalogEditable()) notFound();
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Yeni saat</h1>
      </header>
      <ProductEditor product={null} brands={BRAND_CHOICES} collections={COLLECTION_CHOICES} />
    </>
  );
}
