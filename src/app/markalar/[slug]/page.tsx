import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { BrandFilmIntro } from "@/components/sections/brand/BrandFilmIntro";
import { ButtonLink } from "@/components/ui/Button";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { getArticlesByBrand, getBrand, getBrands, getProductsByBrand } from "@/lib/services/catalog";
import { whatsappUrl } from "@/lib/services/enquiries";
import styles from "./page.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getBrands()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/markalar/[slug]">): Promise<Metadata> {
  const b = await getBrand((await params).slug);
  if (!b) return {};
  return { title: `${b.name} Saatleri — Furkan Saat`, description: b.description };
}

/** A house: its opening (film when there is one), its story in brief, its watches. */
export default async function BrandPage({ params }: PageProps<"/markalar/[slug]">) {
  const brand = await getBrand((await params).slug);
  if (!brand) notFound();
  const [products, brands, articles] = await Promise.all([getProductsByBrand(brand.slug), getBrands(), getArticlesByBrand(brand.slug)]);
  const others = brands.filter((b) => b.slug !== brand.slug);

  return (
    <>
      <main>
        {brand.film && (
          <BrandFilmIntro dir={brand.film.dir} count={brand.film.count} brand={brand.name} title={brand.name} accent={brand.film.accent} />
        )}

        <div className={`page ${brand.film ? styles.afterFilm : ""}`} data-nav-theme="light">
          <header className={`container ${styles.intro}`}>
            <div className={`rise ${styles.facts}`}>
              <SectionMarker label="Saat evi" />
              <dl>
                <div>
                  <dt>Kuruluş</dt>
                  <dd>{brand.founded}</dd>
                </div>
                <div>
                  <dt>Köken</dt>
                  <dd>{brand.origin}</dd>
                </div>
              </dl>
            </div>
            {brand.film ? (
              <h2 className={`t-display rise ${styles.name}`} style={{ "--i": 1 } as React.CSSProperties}>
                {brand.signature}
              </h2>
            ) : (
              <h1 className={`t-display rise ${styles.name}`} style={{ "--i": 1 } as React.CSSProperties}>
                {brand.name}
              </h1>
            )}
            <div className={`rise ${styles.story}`} style={{ "--i": 2 } as React.CSSProperties}>
              {!brand.film && <p className={styles.signature}>{brand.signature}</p>}
              <p className="t-lead">{brand.description}</p>
            </div>
          </header>

          <section className={`container ${styles.watches}`} aria-label={`${brand.name} saatleri`}>
            <p className={styles.label}>
              {products.length > 0 ? `Koleksiyonda · ${products.length} saat` : "Koleksiyonda"}
            </p>
            {products.length > 0 ? (
              <ProductGrid products={products} priorityCount={brand.film ? 0 : 3} />
            ) : (
              <div className={styles.empty}>
                <p className={styles.emptyText}>
                  Şu anda vitrinde {brand.name} saati yok. Aradığınız referansı danışmanlarımız sizin için bulabilir.
                </p>
                <ButtonLink href={whatsappUrl(`Merhaba, ${brand.name} saatleri hakkında bilgi almak istiyorum.`)} external>
                  Danışmana yazın
                </ButtonLink>
              </div>
            )}
          </section>

          {articles.length > 0 && (
            <section className={`container ${styles.watches}`} aria-label="Dergiden">
              <p className={styles.label}>Dergiden</p>
              <ul className={styles.articles}>
                {articles.map((a) => (
                  <li key={a.slug}>
                    <ArticleCard article={a} feature />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className={`container ${styles.others}`} aria-label="Diğer markalar">
            <p className={styles.label}>Diğer saat evleri</p>
            <ul>
              {others.map((b) => (
                <li key={b.slug}>
                  <Link href={`/markalar/${b.slug}`}>{b.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
