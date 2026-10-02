import type { Metadata } from "next";
import { AccountNav } from "@/components/account/AccountNav";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import styles from "./layout.module.css";

export const metadata: Metadata = { title: "Hesabım — Furkan Saat", robots: { index: false } };

/** Account pages share the header and the side index. */
export default function AccountLayout({ children }: LayoutProps<"/hesap">) {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Hesabım"
          title="*Hesabım*"
          lede="Siparişleriniz, favorileriniz ve talepleriniz. Hesabınız şimdilik bu cihazda saklanır; üye girişi yakında."
        />
        <div className={`container ${styles.layout}`}>
          <AccountNav />
          <div>{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
