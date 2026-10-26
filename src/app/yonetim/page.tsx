import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { BRANDS } from "@/lib/data/brands";
import { requireAdmin } from "@/lib/admin/auth";
import { adminCatalog, isCatalogEditable } from "@/lib/admin/catalogStore";
import styles from "@/components/admin/admin.module.css";

export default async function AdminInventoryPage() {
  await requireAdmin();
  if (!isCatalogEditable()) notFound();
  const products = await adminCatalog().list();
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Saatler ve stok</h1>
          <p className={styles.lede}>
            {products.length} saat. Bulunabilirlik ve ana sayfa seçimi burada hemen kaydedilir; diğer bilgiler için saati düzenleyin.
            Değişiklikler sitede anında görünür.
          </p>
        </div>
        <ButtonLink href="/yonetim/urunler/yeni" variant="solid">
          Yeni saat
        </ButtonLink>
      </header>
      <InventoryTable products={products} brands={Object.fromEntries(BRANDS.map((b) => [b.slug, b.name]))} />
    </>
  );
}
