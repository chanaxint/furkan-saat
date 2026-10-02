"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AccountNav.module.css";

const LINKS = [
  { href: "/hesap", label: "Siparişler" },
  { href: "/hesap/favoriler", label: "Favoriler" },
  { href: "/hesap/talepler", label: "Randevu ve talepler" },
  { href: "/hesap/adresler", label: "Adresler" },
  { href: "/hesap/profil", label: "Profil" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Hesabım">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
