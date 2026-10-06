"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authMessage } from "@/lib/auth/messages";
import { passwordProblem, validEmail } from "@/lib/auth/validation";
import { getSupabase } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/supabase/config";
import styles from "./AuthScreen.module.css";

type Tab = "in" | "up";
type Errors = Partial<Record<"first_name" | "last_name" | "email" | "password" | "password2", string>>;

/** One labelled input with its inline message (the house's underline field). */
export function AuthField({
  name,
  label,
  error,
  type = "text",
  reveal,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  reveal?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className={styles.field} data-invalid={error ? true : undefined}>
      <label htmlFor={id}>
        <i aria-hidden>*</i> {label}
      </label>
      <div className={styles.control}>
      <input
        id={id}
        name={name}
        type={reveal && show ? "text" : type}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-msg` : undefined}
        {...rest}
      />
      {reveal && (
        <button
          type="button"
          className={styles.eye}
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          aria-pressed={show}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {!show && <path d="M4 4l16 16" />}
          </svg>
        </button>
      )}
      </div>
      {error && (
        <p id={`${id}-msg`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

/** The photograph beside every membership screen. */
export function AuthPhoto() {
  return (
    <div className={styles.photo}>
      <Image
        src="/assets/images/account-dk.webp"
        alt="Gri kayalar üzerinde siyah kadranlı çelik Daniel Klein saat"
        fill
        priority
        sizes="(max-width: 860px) 100vw, 70vw"
      />
    </div>
  );
}

export function NotConfigured() {
  return (
    <p className={styles.notice} role="status">
      Üyelik sistemi şu anda hazırlanıyor. Siparişleriniz ve sorularınız için bize İletişim sayfasından ulaşabilirsiniz.
    </p>
  );
}

/**
 * Sign in / sign up (Supabase Auth): the form on the left, the photograph on
 * the right (stacked on phones). After signing up the customer confirms the
 * e-mail address from the link sent to it; after signing in they go on to the
 * page they asked for (`next`).
 */
export function AuthScreen({ next = "/hesap", initialTab = "in", notice }: { next?: string; initialTab?: Tab; notice?: string }) {
  const router = useRouter();
  const { available } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);
  const tabsId = useId();

  const callback = () => `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;

  const choose = (t: Tab) => {
    setTab(t);
    setErrors({});
    setFailure(null);
    setUnconfirmed(null);
  };

  const resend = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) setFailure(authMessage(error));
    else setResent(true);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const get = (k: string) => String(d.get(k) ?? "");
    const email = get("email").trim().toLowerCase();
    const password = get("password");

    const found: Errors = {};
    if (tab === "up") {
      if (!get("first_name").trim()) found.first_name = "Adınızı yazın.";
      if (!get("last_name").trim()) found.last_name = "Soyadınızı yazın.";
    }
    if (!email) found.email = "E-posta adresinizi yazın.";
    else if (!validEmail(email)) found.email = "Geçerli bir e-posta adresi yazın.";
    if (tab === "in") {
      if (!password) found.password = "Şifrenizi yazın.";
    } else {
      const problem = passwordProblem(password);
      if (problem) found.password = problem;
      if (!get("password2")) found.password2 = "Şifrenizi tekrar yazın.";
      else if (get("password2") !== password) found.password2 = "Şifreler aynı değil.";
    }
    setErrors(found);
    setFailure(null);
    setUnconfirmed(null);
    const first = Object.keys(found)[0];
    if (first) {
      (form.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    if (tab === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setBusy(false);
        setFailure(authMessage(error));
        if (error.code === "email_not_confirmed") setUnconfirmed(email);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callback(),
        data: { first_name: get("first_name").trim(), last_name: get("last_name").trim() },
      },
    });
    setBusy(false);
    if (error) {
      setFailure(authMessage(error));
      return;
    }
    // E-mail confirmation off (e.g. in development): signed in already.
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setSentTo(email);
  };

  if (sentTo)
    return (
      <div className={styles.screen} data-nav-theme="light">
        <section className={styles.panel} aria-labelledby="dogrula-baslik">
          <h1 id="dogrula-baslik" className={styles.heading}>
            E-postanızı doğrulayın
          </h1>
          <div className={styles.copy} role="status">
            <p>
              <strong>{sentTo}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığınızda hesabınız açılır.
            </p>
            <p className={styles.muted}>E-posta birkaç dakika içinde gelmezse gereksiz klasörünü de kontrol edin.</p>
          </div>
          {failure && (
            <p className={styles.error} role="alert">
              {failure}
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.textButton} onClick={() => resend(sentTo)} disabled={busy || resent}>
              {resent ? "Bağlantı yeniden gönderildi" : "Bağlantıyı yeniden gönder"}
            </button>
            <button type="button" className={styles.textButton} onClick={() => (setSentTo(null), choose("in"))}>
              Giriş ekranına dönün
            </button>
          </div>
        </section>
        <AuthPhoto />
      </div>
    );

  return (
    <div className={styles.screen} data-nav-theme="light">
      <section className={styles.panel}>
        <h1 className="visually-hidden">{tab === "in" ? "Üye girişi" : "Üye ol"}</h1>
        <div className={styles.tabs} role="tablist" aria-label="Üyelik">
          {(["in", "up"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`${tabsId}-${t}`}
              aria-selected={tab === t}
              aria-controls={`${tabsId}-panel`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => choose(t)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  const other = t === "in" ? "up" : "in";
                  choose(other);
                  document.getElementById(`${tabsId}-${other}`)?.focus();
                }
              }}
            >
              {t === "in" ? "Üye Girişi" : "Üye Ol"}
            </button>
          ))}
        </div>

        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        {!available && <NotConfigured />}

        <form
          id={`${tabsId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${tab}`}
          className={styles.form}
          onSubmit={submit}
          noValidate
          key={tab}
        >
          {tab === "up" && (
            <div className={styles.pair}>
              <AuthField name="first_name" label="Ad" autoComplete="given-name" maxLength={80} error={errors.first_name} />
              <AuthField name="last_name" label="Soyad" autoComplete="family-name" maxLength={80} error={errors.last_name} />
            </div>
          )}
          <AuthField name="email" label="E-posta" type="email" autoComplete="email" inputMode="email" maxLength={320} error={errors.email} />
          <AuthField
            name="password"
            label="Şifre"
            type="password"
            reveal
            autoComplete={tab === "in" ? "current-password" : "new-password"}
            maxLength={72}
            error={errors.password}
          />
          {tab === "up" && (
            <AuthField name="password2" label="Şifre tekrar" type="password" reveal autoComplete="new-password" maxLength={72} error={errors.password2} />
          )}
          {tab === "up" && !errors.password && <p className={styles.hint}>En az 8 karakter; en az bir harf ve bir rakam.</p>}

          {failure && (
            <p className={styles.error} role="alert">
              {failure}
            </p>
          )}
          {unconfirmed && (
            <button type="button" className={styles.textButton} onClick={() => resend(unconfirmed)} disabled={busy || resent}>
              {resent ? "Doğrulama bağlantısı gönderildi" : "Doğrulama bağlantısını yeniden gönderin"}
            </button>
          )}

          <button type="submit" className={styles.submit} disabled={busy || !available} aria-busy={busy}>
            {busy ? "Lütfen bekleyin…" : tab === "in" ? "Üye Girişi" : "Üye Ol"}
          </button>
          {tab === "in" && (
            <Link className={styles.forgot} href="/sifremi-unuttum">
              Şifremi unuttum
            </Link>
          )}
        </form>
      </section>

      <AuthPhoto />
    </div>
  );
}
