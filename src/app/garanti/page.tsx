import type { Metadata } from "next";
import { InfoPageView } from "@/components/content/InfoPageView";
import { getInfoPage } from "@/lib/data/info";

const page = getInfoPage("garanti");

export const metadata: Metadata = { title: `${page.name} — Furkan Saat`, description: page.lede };

export default function WarrantyPage() {
  return <InfoPageView page={page} />;
}
