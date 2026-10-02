import type { Metadata } from "next";
import { WishlistView } from "@/components/account/WishlistView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Favoriler — Furkan Saat", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Favoriler" title="Kaydettiğiniz *saatler*" />
        <WishlistView />
        <div style={{ height: "var(--space-xl)" }} />
      </main>
      <Footer />
    </>
  );
}
