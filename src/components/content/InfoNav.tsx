import Link from "next/link";
import { INFO_PAGES } from "@/lib/data/info";
import styles from "./InfoNav.module.css";

/** Links between the information pages, current one marked. */
export function InfoNav({ current }: { current: string }) {
  const links = [...INFO_PAGES.map((p) => ({ href: `/${p.slug}`, name: p.name })), { href: "/sss", name: "Sık sorulanlar" }];
  return (
    <nav className={styles.nav} aria-label="Bilgi sayfaları">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.href === `/${current}` ? "page" : undefined}>
          {l.name}
        </Link>
      ))}
    </nav>
  );
}
