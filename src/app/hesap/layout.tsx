import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AccountGate } from "@/components/account/AccountGate";
import { AccountNav } from "@/components/account/AccountNav";
import { AccountNotice } from "@/components/account/AccountNotice";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getUserId } from "@/lib/supabase/server";
import styles from "./layout.module.css";

export const metadata: Metadata = { title: "Hesabım — Furkan Saat", robots: { index: false } };

/** Account pages share the header and the side index; signed-in customers only. */
export default async function AccountLayout({ children }: LayoutProps<"/hesap">) {
  // The proxy has already sent visitors without a session to /giris; this is the server's own check.
  if (!(await getUserId())) redirect("/giris");
  return (
    <AccountGate>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Hesabım" title="*Hesabım*" lede="Profiliniz, adresleriniz, siparişleriniz ve favorileriniz." />
        <div className={`container ${styles.layout}`}>
          <AccountNav />
          <div>
            <Suspense fallback={null}>
              <AccountNotice />
            </Suspense>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </AccountGate>
  );
}
