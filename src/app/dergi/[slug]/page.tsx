import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { ArticleBody } from "@/components/journal/ArticleBody";
import { ArticleCard } from "@/components/journal/ArticleCard";
import { ProductGrid } from "@/components/product/ProductGrid";
import { brandName, getArticle, getArticles, getProductsBySlugs } from "@/lib/services/catalog";
import { formatDate } from "@/lib/format";
import styles from "./page.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/dergi/[slug]">): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: `${a.title} — Furkan Saat Dergi`,
    description: a.excerpt,
    openGraph: { type: "article", title: a.title, description: a.excerpt, images: [a.cover], publishedTime: a.date },
  };
}

export default async function ArticlePage({ params }: PageProps<"/dergi/[slug]">) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const [products, all] = await Promise.all([getProductsBySlugs(article.products), getArticles()]);
  const more = all.filter((a) => a.slug !== article.slug).slice(0, 2);

  return (
    <>
      <main className="page" data-nav-theme="light">
        <article>
          <header className={`container ${styles.header}`}>
            <p className={`rise ${styles.meta}`}>
              <Link href="/dergi">Dergi</Link>
              <span aria-hidden>/</span>
              <span>{article.category}</span>
            </p>
            <h1 className={`t-display rise ${styles.title}`} style={{ "--i": 1 } as React.CSSProperties}>
              {article.title}
            </h1>
            <p className={`t-lead rise ${styles.excerpt}`} style={{ "--i": 2 } as React.CSSProperties}>
              {article.excerpt}
            </p>
            <p className={`rise ${styles.byline}`} style={{ "--i": 3 } as React.CSSProperties}>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span>{article.readTime}</span>
              {article.brands.map((b) => (
                <Link key={b} href={`/markalar/${b}`}>
                  {brandName(b)}
                </Link>
              ))}
            </p>
          </header>

          <figure className={`container ${styles.cover}`}>
            <div className={styles.coverImage}>
              <Image src={article.cover} alt="" fill priority sizes="(max-width: 900px) 100vw, 720px" />
            </div>
          </figure>

          <div className="container">
            <ArticleBody blocks={article.body} />
          </div>
        </article>

        {products.length > 0 && (
          <section className={`container ${styles.section}`} aria-label="Bu yazıdaki saatler">
            <p className={styles.label}>Bu yazıdaki saatler</p>
            <ProductGrid products={products} />
          </section>
        )}

        <section className={`container ${styles.section}`} aria-label="Diğer yazılar">
          <p className={styles.label}>Dergiden</p>
          <ul className={styles.more}>
            {more.map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} feature />
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
