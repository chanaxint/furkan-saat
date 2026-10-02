import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/kontrol", "/yonetim", "/api/", "/sepet", "/favoriler", "/hesap", "/odeme"] },
    sitemap: "https://furkansaat.com/sitemap.xml",
  };
}
