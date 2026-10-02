import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getArticles } from "@/lib/services/catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Dergi — Furkan Saat",
  description: "Saatçilik üzerine yazılar: komplikasyonlar, ikon modeller, manüfaktürler ve koleksiyon rehberleri.",
};

export default async function JournalPage() {
  const [featured, ...rest] = await getArticles();
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Dergi" title="Saatçiliğin *dünyası*" lede="Komplikasyonlar, ikonlar ve manüfaktürler üzerine yazılar." />
        <div className="container">
          <div className={styles.featured}>
            <ArticleCard article={featured} feature priority />
          </div>
          <ul className={styles.grid}>
            {rest.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
