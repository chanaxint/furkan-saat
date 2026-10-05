import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NotFound() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="404"
          title="Bu sayfa *bulunamadı*"
          lede="Aradığınız sayfa taşınmış ya da artık mevcut değil."
          aside={<ButtonLink href="/#koleksiyon">Koleksiyona dönün</ButtonLink>}
        />
      </main>
      <Footer />
    </>
  );
}
