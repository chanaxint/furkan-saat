import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProducts } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Koleksiyon — Furkan Saat",
  description: "Rolex, Patek Philippe, Jacob & Co. ve daha fazlası. Orijinalliği doğrulanmış seçkin saatler, İstanbul.",
};

export default async function CollectionPage() {
  const products = await getProducts();
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Koleksiyon"
          title="*Koleksiyon*"
          lede="Butiğimizdeki saatlerin tamamı. Her biri orijinalliği doğrulanmış, incelenmiş ve belgeleriyle teslim edilir."
        />
        <CatalogView products={products} />
        <div style={{ height: "var(--space-xl)" }} />
      </main>
      <Footer />
    </>
  );
}
