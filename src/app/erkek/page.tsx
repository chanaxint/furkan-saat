import type { Metadata } from "next";
import { GenderCollection } from "@/components/catalog/GenderCollection";

export const metadata: Metadata = {
  title: "Erkek Saatleri — Furkan Saat",
  description: "Furkan Saat'teki erkek saatlerinin tamamı: Casio, Daniel Klein, Santa Barbara Polo & Racquet Club ve daha fazlası.",
};

export default function MenPage() {
  return <GenderCollection gender="erkek" />;
}
