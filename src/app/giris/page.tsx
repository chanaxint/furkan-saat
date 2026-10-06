import type { Metadata } from "next";
import { AuthScreen } from "@/components/account/AuthScreen";
import { safeNext } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Üye Girişi — Furkan Saat", robots: { index: false } };

const NOTICES: Record<string, string> = {
  "oturum:sona-erdi": "Oturumunuzun süresi doldu. Devam etmek için yeniden giriş yapın.",
  "hata:baglanti": "Bu bağlantı geçersiz ya da süresi dolmuş. Giriş yapabilir veya yeni bir bağlantı isteyebilirsiniz.",
  "cikis:tamam": "Çıkış yaptınız.",
};

/** Sign in / sign up. `?next=` is where to go afterwards (paths on this site only). */
export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const q = await searchParams;
  const one = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : undefined);
  const notice = ["oturum", "hata", "cikis"].map((k) => NOTICES[`${k}:${one(k)}`]).find(Boolean);
  return <AuthScreen next={safeNext(one("next"))} initialTab={one("sekme") === "uye-ol" ? "up" : "in"} notice={notice} />;
}
