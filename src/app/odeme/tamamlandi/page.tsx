import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Siparişiniz alındı — Furkan Saat", robots: { index: false } };

export default function OrderCompletePage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <OrderConfirmation />
      </main>
      <Footer />
    </>
  );
}
