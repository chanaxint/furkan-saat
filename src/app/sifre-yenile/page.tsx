import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordScreen } from "@/components/account/PasswordScreens";
import { getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Yeni Şifre — Furkan Saat", robots: { index: false } };

/** Reached from the password-reset e-mail (through /auth/callback, which opens the session). */
export default async function ResetPasswordPage() {
  if (!(await getUserId())) redirect("/sifremi-unuttum?hata=baglanti");
  return <ResetPasswordScreen />;
}
