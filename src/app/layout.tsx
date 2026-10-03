import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { ScrollLine } from "@/components/layout/ScrollLine";
import { SiteLoader } from "@/components/layout/SiteLoader";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://furkansaat.com"),
  title: "Furkan Saat — Seçkin Saatler, İstanbul",
  description:
    "Seçkin saatler için özel bir ev. Casio, Daniel Klein, Essence ve Freelook — orijinal saatler, İstanbul.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preload" href="/fonts/playfair-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/playfair-display-latin-wght-italic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/jost-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <SmoothScroll>
          <Navigation />
          {children}
          <ScrollLine />
          <SiteLoader />
        </SmoothScroll>
      </body>
    </html>
  );
}
