"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { BOUTIQUE } from "@/lib/data/site";
import styles from "./SiteMenu.module.css";

const MAIN = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Markalar", href: "/markalar" },
  { label: "Koleksiyon", href: "/#koleksiyon" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

const GROUPS = [
  {
    title: "Hizmetler",
    links: [
      { label: "Özel gösterim", href: "/ozel-gosterim" },
      { label: "Saatinizi satın", href: "/saatinizi-satin" },
      { label: "Takas", href: "/takas" },
    ],
  },
  {
    title: "Hesap",
    links: [
      { label: "Favoriler", href: "/favoriler" },
      { label: "Hesabım", href: "/hesap" },
      { label: "Karşılaştır", href: "/karsilastir" },
    ],
  },
];

/**
 * The site menu, opened from the hamburger at the top left: a half-page green
 * panel from the left (full width on phones) carrying the whole navigation.
 */
export function SiteMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const current = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));
  let i = 0;

  return (
    <Drawer open={open} onClose={onClose} label="Menü" side="left" size="half" tone="green">
      <nav className={styles.menu} aria-label="Menü">
        <ul className={styles.main}>
          {MAIN.map((l, n) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={onClose}
                className={styles.row}
                aria-current={current(l.href) ? "page" : undefined}
                style={{ "--i": i++ } as React.CSSProperties}
              >
                <span className={styles.index}>{String(n + 1).padStart(2, "0")}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.groups}>
          {GROUPS.map((g) => (
            <div key={g.title} className={styles.group}>
              <p className={styles.groupTitle}>{g.title}</p>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={onClose}
                      className={styles.small}
                      aria-current={current(l.href) ? "page" : undefined}
                      style={{ "--i": i++ } as React.CSSProperties}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <p className={styles.groupTitle}>Butik — {BOUTIQUE.city}</p>
        <p className={styles.hours}>{BOUTIQUE.hours}</p>
        <Link href="/ozel-gosterim" onClick={onClose} className={styles.cta}>
          Özel randevu alın <span aria-hidden>→</span>
        </Link>
      </div>
    </Drawer>
  );
}
