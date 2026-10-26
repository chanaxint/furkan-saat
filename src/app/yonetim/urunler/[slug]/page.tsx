import { notFound } from "next/navigation";
import { BRAND_CHOICES, COLLECTION_CHOICES } from "@/components/admin/editorOptions";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCatalog, isCatalogEditable } from "@/lib/admin/catalogStore";
import styles from "@/components/admin/admin.module.css";

export default async function AdminProductPage({ params }: PageProps<"/yonetim/urunler/[slug]">) {
  const { slug } = await params;
  await requireAdmin(`/yonetim/urunler/${encodeURIComponent(slug)}`);
  if (!isCatalogEditable()) notFound();
  const product = (await adminCatalog().list()).find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>{product.model}</h1>
      </header>
      <ProductEditor product={product} brands={BRAND_CHOICES} collections={COLLECTION_CHOICES} />
    </>
  );
}
