import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/yonetim", "/api/", "/sepet", "/favoriler", "/hesap", "/odeme", "/giris", "/sifremi-unuttum", "/sifre-yenile", "/auth/"] },
    sitemap: "https://furkansaat.com/sitemap.xml",
  };
}
