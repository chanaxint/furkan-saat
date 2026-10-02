import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { getCollection, getCollections, getProducts } from "@/lib/services/catalog";
import { whatsappUrl } from "@/lib/services/enquiries";
import styles from "./page.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/koleksiyonlar/[slug]">): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  if (!c) return {};
  return { title: `${c.name} — Furkan Saat`, description: c.description };
}

/** A collection: its own ground colour for the opening, then its watches. */
export default async function CollectionPage({ params }: PageProps<"/koleksiyonlar/[slug]">) {
  const collection = await getCollection((await params).slug);
  if (!collection) notFound();
  const [all, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = all.filter((p) => p.collections.includes(collection.slug));
  const others = collections.filter((c) => c.slug !== collection.slug && all.some((p) => p.collections.includes(c.slug)));
  const dark = collection.ground === "green" || collection.ground === "wine";

  return (
    <>
      <main>
        <header className={styles.opening} data-ground={collection.ground} data-nav-theme={dark ? "dark" : "light"}>
          <div className={`container ${styles.openingInner}`}>
            <div className="rise">
              <SectionMarker label="Koleksiyon" />
            </div>
            <h1 className={`t-display rise ${styles.name}`} style={{ "--i": 1 } as React.CSSProperties}>
              {collection.name}
            </h1>
            <p className={`t-lead rise ${styles.description}`} style={{ "--i": 2 } as React.CSSProperties}>
              {collection.description}
            </p>
            <p className={`rise ${styles.count}`} style={{ "--i": 3 } as React.CSSProperties}>
              {products.length} saat
            </p>
          </div>
        </header>

        <div className={styles.body} data-nav-theme="light">
          <div className="container">
            {products.length > 0 ? (
              <ProductGrid products={products} priorityCount={3} />
            ) : (
              <div className={styles.empty}>
                <p className={styles.emptyText}>Bu koleksiyon için yeni saatler hazırlanıyor. Aradığınız referansı sizin için bulabiliriz.</p>
                <ButtonLink href={whatsappUrl(`Merhaba, ${collection.name} koleksiyonundaki saatlerle ilgileniyorum.`)} external>
                  Danışmana yazın
                </ButtonLink>
              </div>
            )}
          </div>

          {others.length > 0 && (
            <nav className={`container ${styles.others}`} aria-label="Diğer koleksiyonlar">
              <p className={styles.label}>Diğer koleksiyonlar</p>
              <ul>
                {others.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/koleksiyonlar/${c.slug}`}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
