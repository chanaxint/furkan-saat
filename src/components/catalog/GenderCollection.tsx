import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProductsByGender } from "@/lib/services/catalog";
import styles from "./GenderCollection.module.css";

const COPY = {
  kadin: {
    marker: "Kadın",
    title: "Kadın *saatleri*",
    lede: "Sedef kadranlar, taşlı çerçeveler ve zarif bilezikler: butikteki kadın saatlerinin tamamı.",
  },
  erkek: {
    marker: "Erkek",
    title: "Erkek *saatleri*",
    lede: "Kronograflardan otomatiklere, sade klasiklerden spor modellere: butikteki erkek saatlerinin tamamı.",
  },
} as const;

/** Every watch for women (/kadin) or for men (/erkek), all brands together. */
export async function GenderCollection({ gender }: { gender: "kadin" | "erkek" }) {
  const products = await getProductsByGender(gender);
  const copy = COPY[gender];
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker={copy.marker} title={copy.title} lede={copy.lede} />
        <section className={`container ${styles.watches}`} aria-label={`${copy.marker} saatleri`}>
          <p className={styles.count}>{products.length} saat</p>
          <ProductGrid products={products} priorityCount={4} />
        </section>
      </main>
      <Footer />
    </>
  );
}
