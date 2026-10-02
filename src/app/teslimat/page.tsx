import type { Metadata } from "next";
import { InfoPageView } from "@/components/content/InfoPageView";
import { getInfoPage } from "@/lib/data/info";

const page = getInfoPage("teslimat");

export const metadata: Metadata = { title: `${page.name} — Furkan Saat`, description: page.lede };

export default function ShippingPage() {
  return <InfoPageView page={page} />;
}
