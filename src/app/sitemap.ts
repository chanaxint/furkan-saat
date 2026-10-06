import type { MetadataRoute } from "next";
import { getBrands, getProducts } from "@/lib/services/catalog";

const SITE = "https://furkansaat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([getProducts(), getBrands()]);
  const pages = [
    "",
    "/hakkimizda",
    "/iletisim",
  ];
  return [
    ...pages.map((p) => ({ url: `${SITE}${p}` })),
    ...products.map((p) => ({ url: `${SITE}/saat/${p.slug}`, lastModified: p.addedAt })),
    ...brands.map((b) => ({ url: `${SITE}/markalar/${b.slug}` })),
  ];
}
