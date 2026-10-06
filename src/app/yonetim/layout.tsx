import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isAdminEnabled } from "@/lib/admin/store";
import styles from "./layout.module.css";

export const metadata: Metadata = { title: "Yönetim — Furkan Saat", robots: { index: false, follow: false } };

/**
 * The management panel. It edits the data files in the project, so it exists
 * only while running `npm run dev`; on the live site every /yonetim address is a 404.
 */
export default async function AdminLayout({ children }: LayoutProps<"/yonetim">) {
  await connection();
  if (!isAdminEnabled()) notFound();
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href="/yonetim" className={styles.brand}>
          Furkan <em>Saat</em> · Yönetim
        </Link>
        <nav className={styles.nav}>
          <Link href="/yonetim">Saatler ve stok</Link>
          <Link href="/yonetim/donusler">3D dönüşler</Link>
          <Link href="/yonetim/ayarlar">İletişim ve banka</Link>
          <Link href="/" target="_blank">
            Siteyi aç ↗
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
