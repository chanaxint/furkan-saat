import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { RelatedCarousel } from "@/components/product/RelatedCarousel";
import { brandName } from "@/lib/services/catalog";
import { findMovedProduct } from "@/lib/catalog/source";
import { getProduct, getProducts, getRelated } from "@/lib/services/products";
import { refLabel } from "@/lib/format";
import styles from "./page.module.css";

/**
 * Every watch known at build time is generated then; a watch added later (in
 * the database, from the panel) is generated on its first visit and cached like
 * the others, with no new build. An address that is not a watch is a 404, as
 * before, unless the watch moved there from it (slug changed in the panel).
 *
 * Known trade-off (Next 16.3.6): when notFound() is thrown while a page renders,
 * Next answers 404 with `noindex` but sends only a minimal HTML shell; the 404
 * page itself is drawn in the browser. With dynamicParams = false an unknown
 * address got the prebuilt 404 page in full HTML, but a watch added after the
 * build could not open without a new build. A check in proxy would avoid it, but
 * proxy has no data cache in 16.3.6, so it would query the catalogue on every
 * request. See docs/supabase-kurulum.md, section 7.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/saat/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const title = `${brandName(p.brand)} ${p.model}${p.reference ? ` ${p.reference}` : ""} — Furkan Saat`;
  return {
    title,
    description: p.description,
    openGraph: { title, description: p.description, images: [p.images[0]] },
  };
}

export default async function WatchPage({ params }: PageProps<"/saat/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    const moved = await findMovedProduct(slug);
    if (moved) permanentRedirect(`/saat/${moved}`);
    notFound();
  }
  const brand = brandName(product.brand);
  const related = await getRelated(product, 12);

  // Structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand} ${product.model}`,
    brand: { "@type": "Brand", name: brand },
    ...(product.reference && { sku: product.reference }),
    description: product.description,
    image: product.images,
    ...(product.price !== null && {
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency,
        availability: product.availability === "Stokta" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      },
    }),
  };

  return (
    <>
      <main className={`page ${styles.page}`} data-nav-theme="light">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className={`container ${styles.layout}`}>
          <div className={styles.gallery}>
            <ProductGallery images={product.images} alt={`${brand} ${product.model}`} />
          </div>

          <div className={styles.info}>
            <div className={styles.sticky}>
              <nav className={`rise ${styles.crumbs}`} aria-label="Konum">
                <Link href="/#koleksiyon">Koleksiyon</Link>
                <span aria-hidden>/</span>
                <Link href={`/markalar/${product.brand}`}>{brand}</Link>
              </nav>
              <p className={`rise ${styles.brand}`} style={{ "--i": 1 } as React.CSSProperties}>
                {brand}
              </p>
              <h1 className={`t-display rise ${styles.model}`} style={{ "--i": 2 } as React.CSSProperties}>
                {product.model}
              </h1>
              {product.reference && (
                <p className={`rise ${styles.reference}`} style={{ "--i": 3 } as React.CSSProperties}>
                  {refLabel(product.reference)}
                </p>
              )}

              <div className={`rise ${styles.priceRow}`} style={{ "--i": 4 } as React.CSSProperties}>
                <PriceDisplay price={product.price} currency={product.currency} className={styles.price} />
                <span className={styles.availability} data-state={product.availability}>
                  {product.availability}
                </span>
              </div>

              <div className="rise" style={{ "--i": 5 } as React.CSSProperties}>
                <PurchasePanel product={product} />
              </div>

              <p className={styles.description}>{product.description}</p>

              <section className={styles.specs} aria-label="Teknik özellikler">
                <h2 className={styles.label}>Teknik özellikler</h2>
                <ProductSpecs product={product} />
              </section>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className={`container ${styles.related}`} aria-label="Diğer saatler">
            <RelatedCarousel
              products={related}
              title={
                <h2 className={`t-display ${styles.relatedTitle}`}>
                  Bunlar da <em>ilginizi çekebilir</em>
                </h2>
              }
            />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
