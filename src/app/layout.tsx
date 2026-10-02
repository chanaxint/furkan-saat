import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

export const metadata: Metadata = {
  metadataBase: new URL("https://furkansaat.com"),
  title: "Furkan Saat — Seçkin Saatler, İstanbul",
  description:
    "Seçkin saatler için özel bir ev. Rolex, Patek Philippe, Jacob & Co. ve daha fazlası — orijinalliği doğrulanmış saatler, İstanbul'da randevu ile.",
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
        <link rel="preload" href="/fonts/cormorant-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/cormorant-garamond-latin-wght-italic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <SmoothScroll>
          <Navigation />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
