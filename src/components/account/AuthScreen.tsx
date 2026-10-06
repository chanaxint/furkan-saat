"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn, signUp } from "@/lib/services/account";
import styles from "./AuthScreen.module.css";

/**
 * Sign in / sign up: the form on the left, a full-height photograph on the
 * right (it stacks on phones). Membership lives on this device for now.
 */
export function AuthScreen() {
  const [tab, setTab] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const email = String(d.get("email") ?? "");
    const password = String(d.get("password") ?? "");
    setBusy(true);
    setError(null);
    if (tab === "in") setError(await signIn(email, password));
    else if (password.length < 6) setError("Şifre en az 6 karakter olmalı.");
    else await signUp(String(d.get("name") ?? ""), email, password);
    setBusy(false);
  };

  return (
    <div className={styles.screen} data-nav-theme="light">
      <section className={styles.panel}>
        <div className={styles.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={tab === "in"} onClick={() => (setTab("in"), setError(null))}>
            Üye Girişi
          </button>
          <button type="button" role="tab" aria-selected={tab === "up"} onClick={() => (setTab("up"), setError(null))}>
            Üye Ol
          </button>
        </div>

        <form className={styles.form} onSubmit={submit} key={tab}>
          {tab === "up" && (
            <label className={styles.field}>
              <span>
                <i>*</i> Ad soyad
              </span>
              <input name="name" required autoComplete="name" />
            </label>
          )}
          <label className={styles.field}>
            <span>
              <i>*</i> E-posta
            </span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className={styles.field}>
            <span>
              <i>*</i> Şifre
            </span>
            <input
              name="password"
              type={show ? "text" : "password"}
              required
              autoComplete={tab === "in" ? "current-password" : "new-password"}
            />
            <button type="button" className={styles.eye} onClick={() => setShow((v) => !v)} aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {!show && <path d="M4 4l16 16" />}
              </svg>
            </button>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={busy}>
            {tab === "in" ? "Üye Girişi" : "Üye Ol"}
          </button>
          {tab === "in" && (
            <a className={styles.forgot} href="/iletisim">
              Parolamı unuttum
            </a>
          )}
        </form>
      </section>

      <div className={styles.photo}>
        <Image
          src="/assets/images/account-dk.webp"
          alt="Gri kayalar üzerinde siyah kadranlı çelik Daniel Klein saat"
          fill
          priority
          sizes="(max-width: 860px) 100vw, 44vw"
        />
      </div>
    </div>
  );
}
