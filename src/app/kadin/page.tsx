import type { Metadata } from "next";
import { GenderCollection } from "@/components/catalog/GenderCollection";

export const metadata: Metadata = {
  title: "Kadın Saatleri — Furkan Saat",
  description: "Furkan Saat'teki kadın saatlerinin tamamı: Casio, Essence, Freelook, Santa Barbara Polo & Racquet Club ve daha fazlası.",
};

export default function WomenPage() {
  return <GenderCollection gender="kadin" />;
}
