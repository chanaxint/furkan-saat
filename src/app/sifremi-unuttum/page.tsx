import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/components/account/PasswordScreens";

export const metadata: Metadata = { title: "Şifremi Unuttum — Furkan Saat", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/sifremi-unuttum">) {
  const { hata } = await searchParams;
  return <ForgotPasswordScreen linkFailed={hata === "baglanti"} />;
}
