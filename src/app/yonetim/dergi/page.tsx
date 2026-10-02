import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { readArticles } from "@/lib/admin/store";
import { formatDate } from "@/lib/format";
import styles from "@/components/admin/admin.module.css";

export default async function AdminJournalPage() {
  const articles = (await readArticles()).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Dergi</h1>
          <p className={styles.lede}>{articles.length} yazı. En yeni tarihli yazı dergide ve ana sayfada en büyük gösterilir.</p>
        </div>
        <ButtonLink href="/yonetim/dergi/yeni" variant="solid">
          Yeni yazı
        </ButtonLink>
      </header>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>Başlık</th>
            <th>Kategori</th>
            <th>Tarih</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.slug}>
              <td>
                <img src={a.cover} alt="" className={styles.thumb} />
              </td>
              <td className={styles.name}>{a.title}</td>
              <td className={styles.muted}>{a.category}</td>
              <td className={styles.muted}>{formatDate(a.date)}</td>
              <td>
                <Link href={`/yonetim/dergi/${a.slug}`} className={styles.link}>
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
