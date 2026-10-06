"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authMessage } from "@/lib/auth/messages";
import { passwordProblem, validEmail } from "@/lib/auth/validation";
import { getSupabase } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/supabase/config";
import { AuthField, AuthPhoto, NotConfigured } from "./AuthScreen";
import styles from "./AuthScreen.module.css";

/**
 * Forgotten password: Supabase e-mails a reset link → /auth/callback opens a
 * short session → /sifre-yenile sets the new password → the account.
 * The reply never tells whether an address has an account.
 */
export function ForgotPasswordScreen({ linkFailed = false }: { linkFailed?: boolean }) {
  const { available } = useAuth();
  const [error, setError] = useState<string>();
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!validEmail(email)) {
      setError(email ? "Geçerli bir e-posta adresi yazın." : "E-posta adresinizi yazın.");
      (e.currentTarget.elements.namedItem("email") as HTMLInputElement | null)?.focus();
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setError(undefined);
    setFailure(null);
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/sifre-yenile")}`,
    });
    setBusy(false);
    // Rate limits and network errors are worth saying; "no such user" is never revealed.
    if (err && (err.status === 429 || err.status === 0 || err.name === "AuthRetryableFetchError")) setFailure(authMessage(err));
    else setSent(true);
  };

  return (
    <div className={styles.screen} data-nav-theme="light" data-nav-tone="deep">
      <section className={styles.panel} aria-labelledby="unuttum-baslik">
        <h1 id="unuttum-baslik" className={styles.heading}>
          Şifremi unuttum
        </h1>
        {sent ? (
          <div className={styles.copy} role="status">
            <p>Bu adresle kayıtlı bir hesap varsa, şifrenizi yenilemeniz için bir bağlantı gönderdik.</p>
            <p className={styles.muted}>Bağlantı kısa bir süre geçerlidir. E-posta gelmezse gereksiz klasörünü kontrol edin.</p>
            <Link className={styles.textButton} href="/giris">
              Giriş ekranına dönün
            </Link>
          </div>
        ) : (
          <>
            {linkFailed && (
              <p className={styles.notice} role="status">
                Şifre yenileme bağlantısı geçersiz ya da süresi dolmuş. Yeni bir bağlantı isteyin.
              </p>
            )}
            {!available && <NotConfigured />}
            <p className={styles.copy}>Hesabınızın e-posta adresini yazın; şifrenizi yenilemeniz için bir bağlantı gönderelim.</p>
            <form className={styles.form} onSubmit={submit} noValidate>
              <AuthField name="email" label="E-posta" type="email" autoComplete="email" inputMode="email" error={error} />
              {failure && (
                <p className={styles.error} role="alert">
                  {failure}
                </p>
              )}
              <button type="submit" className={styles.submit} disabled={busy || !available} aria-busy={busy}>
                {busy ? "Lütfen bekleyin…" : "Bağlantı gönder"}
              </button>
              <Link className={styles.forgot} href="/giris">
                Giriş ekranına dönün
              </Link>
            </form>
          </>
        )}
      </section>
      <AuthPhoto />
    </div>
  );
}

/** The new password, set with the session the reset link opened. */
export function ResetPasswordScreen() {
  const router = useRouter();
  const [errors, setErrors] = useState<{ password?: string; password2?: string }>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const password = String(d.get("password") ?? "");
    const password2 = String(d.get("password2") ?? "");
    const found: typeof errors = {};
    const problem = passwordProblem(password);
    if (problem) found.password = problem;
    if (!password2) found.password2 = "Şifrenizi tekrar yazın.";
    else if (password2 !== password) found.password2 = "Şifreler aynı değil.";
    setErrors(found);
    setFailure(null);
    const first = Object.keys(found)[0];
    if (first) {
      (e.currentTarget.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setFailure(authMessage(error));
      return;
    }
    router.replace("/hesap?sifre=yenilendi");
    router.refresh();
  };

  return (
    <div className={styles.screen} data-nav-theme="light" data-nav-tone="deep">
      <section className={styles.panel} aria-labelledby="yenile-baslik">
        <h1 id="yenile-baslik" className={styles.heading}>
          Yeni şifre
        </h1>
        <p className={styles.copy}>Hesabınız için yeni bir şifre belirleyin.</p>
        <form className={styles.form} onSubmit={submit} noValidate>
          <AuthField name="password" label="Yeni şifre" type="password" reveal autoComplete="new-password" maxLength={72} error={errors.password} />
          <AuthField name="password2" label="Yeni şifre tekrar" type="password" reveal autoComplete="new-password" maxLength={72} error={errors.password2} />
          {!errors.password && <p className={styles.hint}>En az 8 karakter; en az bir harf ve bir rakam.</p>}
          {failure && (
            <p className={styles.error} role="alert">
              {failure}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
            {busy ? "Lütfen bekleyin…" : "Şifremi kaydet"}
          </button>
        </form>
      </section>
      <AuthPhoto />
    </div>
  );
}
