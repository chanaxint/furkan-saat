"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import styles from "./AccountNav.module.css";

const LINKS = [
  { href: "/hesap", label: "Profilim" },
  { href: "/hesap/adresler", label: "Adreslerim" },
  { href: "/hesap/siparisler", label: "Siparişlerim" },
  { href: "/hesap/favoriler", label: "Favorilerim" },
  { href: "/hesap/talepler", label: "Randevu ve talepler" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    setLeaving(true);
    await signOut();
    router.replace("/giris?cikis=tamam");
    router.refresh();
  };

  return (
    <nav className={styles.nav} aria-label="Hesabım">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      <button type="button" className={styles.signOut} onClick={leave} disabled={leaving}>
        {leaving ? "Çıkış yapılıyor…" : "Çıkış yap"}
      </button>
    </nav>
  );
}
