import type { MetadataRoute } from "next";
import { INFO_PAGES } from "@/lib/data/info";
import { getArticles, getBrands, getCollections, getProducts } from "@/lib/services/catalog";

const SITE = "https://furkansaat.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands, collections, articles] = await Promise.all([getProducts(), getBrands(), getCollections(), getArticles()]);
  const pages = [
    "",
    "/koleksiyon",
    "/koleksiyonlar",
    "/markalar",
    "/dergi",
    "/hakkimizda",
    "/iletisim",
    "/ozel-gosterim",
    "/saatinizi-satin",
    "/takas",
    "/karsilastir",
    "/sss",
    ...INFO_PAGES.map((p) => `/${p.slug}`),
  ];
  return [
    ...pages.map((p) => ({ url: `${SITE}${p}` })),
    ...products.map((p) => ({ url: `${SITE}/saat/${p.slug}`, lastModified: p.addedAt })),
    ...brands.map((b) => ({ url: `${SITE}/markalar/${b.slug}` })),
    ...collections.map((c) => ({ url: `${SITE}/koleksiyonlar/${c.slug}` })),
    ...articles.map((a) => ({ url: `${SITE}/dergi/${a.slug}`, lastModified: a.date })),
  ];
}
