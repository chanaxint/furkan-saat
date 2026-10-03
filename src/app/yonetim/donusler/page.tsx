import Link from "next/link";
import { StageEditor } from "@/components/admin/StageEditor";
import styles from "@/components/admin/admin.module.css";
import { readStages } from "@/lib/admin/store";
import { BRANDS } from "@/lib/data/brands";

/** Turn editor for the brand pages that open on a 3D watch. */
export default async function AdminStagesPage({ searchParams }: PageProps<"/yonetim/donusler">) {
  const stages = await readStages();
  const brands = BRANDS.filter((b) => b.stage && stages[b.slug]);
  const wanted = (await searchParams).marka;
  const brand = brands.find((b) => b.slug === wanted) ?? brands[0];

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>3D dönüşler</h1>
          <p className={styles.lede}>
            Bir duruş seçin, saati kaydırıcılarla yerleştirin ve önizlemede oynatarak deneyin. Kaydettiğinizde marka sayfası bu
            ayarlarla açılır.
          </p>
        </div>
        {brands.length > 1 && (
          <nav className={styles.actions}>
            {brands.map((b) => (
              <Link key={b.slug} href={`/yonetim/donusler?marka=${b.slug}`} className={styles.link}>
                {b.name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {brand?.stage ? (
        <StageEditor key={brand.slug} brand={brand} stage={brand.stage} initial={stages[brand.slug]} />
      ) : (
        <p className={styles.muted}>Henüz 3D açılışı olan bir marka yok.</p>
      )}
    </>
  );
}
