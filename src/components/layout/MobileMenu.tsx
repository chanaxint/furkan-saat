"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { BOUTIQUE } from "@/lib/data/site";
import styles from "./MobileMenu.module.css";

const LINKS = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Koleksiyon", href: "/koleksiyon" },
  { label: "Markalar", href: "/markalar" },
  { label: "Favoriler", href: "/favoriler" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

/** Menu drawer: on phones and tablets it carries the whole navigation. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} label="Menü" side="left">
      <nav className={styles.list} aria-label="Menü">
        {LINKS.map((l, i) => (
          <Link key={l.href} href={l.href} onClick={onClose} className={styles.row} style={{ "--i": i } as React.CSSProperties}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className={styles.footer}>
        <p className="t-eyebrow">Butik — {BOUTIQUE.city}</p>
        <p className={styles.hours}>{BOUTIQUE.hours}</p>
        <Link href="/iletisim" onClick={onClose} className={styles.cta}>
          Özel randevu alın →
        </Link>
      </div>
    </Drawer>
  );
}
