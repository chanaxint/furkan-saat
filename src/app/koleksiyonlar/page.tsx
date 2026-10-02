import type { Metadata } from "next";
import { CollectionList } from "@/components/content/CollectionList";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCollections, getProducts } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Koleksiyonlar — Furkan Saat",
  description: "Nadir parçalar, ikonik saatler, tourbillon, iskelet, spor ve klasik saatler: seçilmiş koleksiyonlar.",
};

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  // Only collections with watches in them are listed.
  const shown = collections.filter((c) => products.some((p) => p.collections.includes(c.slug)));
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Koleksiyonlar" title="Seçilmiş *koleksiyonlar*" lede="Saatleri karakterlerine göre bir araya getirdik." />
        <div className="container">
          <CollectionList collections={shown} products={products} />
        </div>
        <div style={{ height: "var(--space-xl)" }} />
      </main>
      <Footer />
    </>
  );
}
