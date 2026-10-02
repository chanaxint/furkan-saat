import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Assurances } from "@/components/product/Assurances";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { brandName, getProduct, getProducts, getRelated } from "@/lib/services/catalog";
import styles from "./page.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/saat/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const title = `${brandName(p.brand)} ${p.model} ${p.reference} — Furkan Saat`;
  return {
    title,
    description: p.description,
    openGraph: { title, description: p.description, images: [p.images[0]] },
  };
}

export default async function WatchPage({ params }: PageProps<"/saat/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const brand = brandName(product.brand);
  const related = await getRelated(product);

  // Structured data for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand} ${product.model}`,
    brand: { "@type": "Brand", name: brand },
    sku: product.reference,
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
                <Link href="/koleksiyon">Koleksiyon</Link>
                <span aria-hidden>/</span>
                <Link href={`/markalar/${product.brand}`}>{brand}</Link>
              </nav>
              <p className={`rise ${styles.brand}`} style={{ "--i": 1 } as React.CSSProperties}>
                {brand}
              </p>
              <h1 className={`t-display rise ${styles.model}`} style={{ "--i": 2 } as React.CSSProperties}>
                {product.model}
              </h1>
              <p className={`rise ${styles.reference}`} style={{ "--i": 3 } as React.CSSProperties}>
                Ref. {product.reference}
              </p>

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

        <section className={`container ${styles.assurances}`} aria-label="Güvence">
          <SectionMarker label="Her saatle birlikte" />
          <Assurances />
        </section>

        {related.length > 0 && (
          <section className={`container ${styles.related}`} aria-label="Diğer saatler">
            <h2 className={`t-display ${styles.relatedTitle}`}>
              Bunlar da <em>ilginizi çekebilir</em>
            </h2>
            <ProductGrid products={related} />
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
