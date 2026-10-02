import type { Metadata } from "next";
import { CartView } from "@/components/account/CartView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Sepet — Furkan Saat", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Sepet" title="*Sepet*" />
        <CartView />
      </main>
      <Footer />
    </>
  );
}
