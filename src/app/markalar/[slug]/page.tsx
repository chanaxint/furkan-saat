import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { BrandFilmHero } from "@/components/brand/BrandFilmHero";
import { Petals } from "@/components/effects/Petals";
import { BrandShowcase } from "@/components/brand/BrandShowcase";
import { BrandStage } from "@/components/brand/BrandStage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { getBrand, getBrands, getProductsByBrand } from "@/lib/services/catalog";
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

/**
 * A house: its film and 3D showcase (when it has them), its story in brief,
 * then its watches. `theme: "gold"` dresses the page in white and gold.
 */
export default async function BrandPage({ params }: PageProps<"/markalar/[slug]">) {
  const brand = await getBrand((await params).slug);
  if (!brand) notFound();
  const products = await getProductsByBrand(brand.slug);
  // With a film or a 3D stage, the opening carries the name (as the logo), so
  // the watches follow it directly.
  const film = brand.film;
  const scene = brand.scene;
  const stage = brand.stage;
  const opening = !!(film || scene || stage);

  const pageClass = ["page", opening ? styles.afterFilm : "", scene ? styles.overScene : "", brand.theme === "gold" ? styles.gold : "", stage ? styles.overStage : ""].join(" ");
  const watches = (
    <section
      id="saatler"
      className={`container ${styles.watches} ${opening ? styles.first : ""}`}
      aria-label={`${brand.name} saatleri`}
    >
      <p className={styles.label}>
        {products.length > 0 ? `Koleksiyonda · ${products.length} saat` : "Koleksiyonda"}
      </p>
      {products.length > 0 ? (
        <ProductGrid products={products} priorityCount={3} />
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
  );
  const body = (
    <div id="hikaye" className={pageClass} data-nav-theme="light">
      {/* The petals fall on over the page, behind the watches' photographs. */}
      {scene && <Petals className={styles.scenePetals} wind />}
      {/* …and a few drift in front of them. */}
      {scene && <Petals className={`${styles.scenePetals} ${styles.front}`} wind count={4} />}
      {!opening && (
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
          <h1 className={`t-display rise ${styles.name}`} style={{ "--i": 1 } as React.CSSProperties}>
            {brand.name}
          </h1>
          <div className={`rise ${styles.story}`} style={{ "--i": 2 } as React.CSSProperties}>
            <p className={styles.signature}>{brand.signature}</p>
            <p className="t-lead">{brand.description}</p>
          </div>
        </header>
      )}

      {watches}
      {/* The very foot of the site: the watch on gathered petals, the page above it. */}
      {scene?.carpet && (
        <div className={styles.carpet}>
          {/* The house's name closes the page, in the ivory above the petals. */}
          <p className={styles.carpetMark}>
            Furkan <span>Saat</span>
          </p>
          <Image src={scene.carpet} alt="" fill sizes="100vw" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <main>
        {(film || scene) && <BrandFilmHero brand={brand} next={brand.showcase ? "#yakindan" : "#saatler"} />}
        {brand.showcase && (
          <div id="yakindan" className={brand.theme === "gold" ? styles.gold : undefined}>
            <BrandShowcase showcase={brand.showcase} label={`${brand.name} — yakından`} />
          </div>
        )}
        {stage ? (
          <BrandStage
            brand={brand}
            stage={stage}
            next="#saatler"
          >
            <div id="hikaye" className={pageClass} data-nav-theme="light">
              {watches}
            </div>
          </BrandStage>
        ) : (
          body
        )}
      </main>
      {/* A 3D stage page ends on its water film. */}
      {/* A 3D stage page ends on its water film, a scene page on its petals. */}
      {!stage && !scene && <Footer />}
    </>
  );
}
