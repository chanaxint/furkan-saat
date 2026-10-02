import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBrands, getProducts } from "@/lib/services/catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Markalar — Furkan Saat",
  description: "Casio, Daniel Klein, Essence ve Freelook: butiğimizdeki saat markaları.",
};

/** The brand directory: an index set in type, one house per line. */
export default async function BrandsPage() {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);
  const count = (slug: string) => products.filter((p) => p.brand === slug).length;

  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Markalar"
          title="*Markalar*"
          lede="Butiğimizde bulunan markalar ve saatleri."
        />
        <ol className={`container ${styles.index}`}>
          {brands.map((b, i) => (
            <li key={b.slug} className="rise" style={{ "--i": i + 2 } as React.CSSProperties}>
              <Link href={`/markalar/${b.slug}`} className={styles.row}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.name}>{b.name}</span>
                <span className={styles.signature}>{b.signature}</span>
                <span className={styles.meta}>
                  {b.origin} · {b.founded}
                  {count(b.slug) > 0 && <em> · {count(b.slug)} saat</em>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <div style={{ height: "var(--space-xl)" }} />
      </main>
      <Footer />
    </>
  );
}
