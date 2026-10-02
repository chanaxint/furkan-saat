import type { Metadata } from "next";
import { CompareView } from "@/components/compare/CompareView";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Saat Karşılaştırma — Furkan Saat",
  description: "Koleksiyondaki saatleri fiyat, mekanizma, kasa ve özelliklerine göre yan yana karşılaştırın.",
};

export default function ComparePage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker="Karşılaştır" title="Yan *yana*" lede="Saatleri mekanizma, kasa ve özelliklerine göre karşılaştırın." />
        <CompareView />
      </main>
      <Footer />
    </>
  );
}
