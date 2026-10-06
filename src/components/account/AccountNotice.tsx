"use client";

import { useSearchParams } from "next/navigation";
import styles from "./AccountViews.module.css";

const NOTICES: Record<string, string> = {
  dogrulandi: "E-posta adresiniz doğrulandı. Furkan Saat'e hoş geldiniz.",
  yenilendi: "Şifreniz güncellendi.",
};

/** One line after an e-mail link or a password change, on whichever account page it lands. */
export function AccountNotice() {
  const q = useSearchParams();
  const text = q.get("dogrulandi") ? NOTICES.dogrulandi : q.get("sifre") === "yenilendi" ? NOTICES.yenilendi : null;
  if (!text) return null;
  return (
    <p className={`${styles.notice} ${styles.pageNotice}`} role="status">
      {text}
    </p>
  );
}
