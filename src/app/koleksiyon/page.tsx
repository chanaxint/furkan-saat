import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { getCollections, getProducts } from "@/lib/services/catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Koleksiyon — Furkan Saat",
  description: "Casio, Daniel Klein, Essence ve Freelook saatleri. Orijinal, faturalı ve garantili saatler, İstanbul.",
};

export default async function CollectionPage() {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const shown = collections.filter((c) => products.some((p) => p.collections.includes(c.slug)));
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Koleksiyon"
          title="*Koleksiyon*"
          lede="Butiğimizdeki saatlerin tamamı. Her biri orijinalliği doğrulanmış, incelenmiş ve belgeleriyle teslim edilir."
          aside={
            <nav className={styles.collections} aria-label="Koleksiyonlar">
              <span>Koleksiyonlar</span>
              {shown.map((c) => (
                <Link key={c.slug} href={`/koleksiyonlar/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </nav>
          }
        />
        <CatalogView products={products} />
        <div style={{ height: "var(--space-xl)" }} />
      </main>
      <Footer />
    </>
  );
}
