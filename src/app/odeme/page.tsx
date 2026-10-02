import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Ödeme — Furkan Saat", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Ödeme" title="*Ödeme*" />
        <CheckoutView />
      </main>
      <Footer />
    </>
  );
}
