import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { isCatalogEditable } from "@/lib/admin/catalogStore";
import { isFileEditingEnabled } from "@/lib/admin/store";
import styles from "./layout.module.css";

export const metadata: Metadata = { title: "Yönetim — Furkan Saat", robots: { index: false, follow: false } };

/**
 * The management panel, for signed-in admins only (each page checks again, as
 * a layout is not re-run between its pages). The watches can be managed on
 * the live site once they live in the database (CATALOG_SOURCE=db); with
 * products.json, and always for the pages that edit the project's other data
 * files (settings, 3D openings), only while running `npm run dev`. Otherwise
 * every /yonetim address is a 404.
 */
export default async function AdminLayout({ children }: LayoutProps<"/yonetim">) {
  await connection();
  await requireAdmin();
  if (!isCatalogEditable()) notFound();
  const files = isFileEditingEnabled();
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href="/yonetim" className={styles.brand}>
          Furkan <em>Saat</em> · Yönetim
        </Link>
        <nav className={styles.nav}>
          <Link href="/yonetim">Saatler ve stok</Link>
          {files && <Link href="/yonetim/donusler">3D dönüşler</Link>}
          {files && <Link href="/yonetim/ayarlar">İletişim ve banka</Link>}
          <Link href="/" target="_blank">
            Siteyi aç ↗
          </Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
