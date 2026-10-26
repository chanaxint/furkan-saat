import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { ScrollLine } from "@/components/layout/ScrollLine";
import { SiteLoader } from "@/components/layout/SiteLoader";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CatalogProvider } from "@/components/providers/CatalogProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { getProducts } from "@/lib/services/products";

export const metadata: Metadata = {
  metadataBase: new URL("https://furkansaat.com"),
  title: "Furkan Saat — Seçkin Saatler, Nevşehir",
  description:
    "Seçkin saatler için özel bir ev. Casio, Daniel Klein, Essence ve Freelook — orijinal saatler, Nevşehir.",
  openGraph: {
    title: "Furkan Saat — Seçkin Saatler",
    description: "Seçkin saatler için özel bir ev.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071a16",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts();
  return (
    <html lang="tr">
      <head>
        <link rel="preload" href="/fonts/playfair-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/jost-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <AuthProvider>
          <CatalogProvider products={products}>
            <SmoothScroll>
              <Navigation />
              {children}
              <ScrollLine />
              <SiteLoader />
            </SmoothScroll>
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
